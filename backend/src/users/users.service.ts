import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async syncUser(data: {
    firebaseUid: string;
    email: string;
    displayName?: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: [{ firebaseUid: data.firebaseUid }, { email: data.email }],
    });

    if (existing) {
      let needsSave = false;
      if (existing.firebaseUid !== data.firebaseUid) {
        existing.firebaseUid = data.firebaseUid;
        needsSave = true;
      }
      if (data.displayName && existing.displayName !== data.displayName) {
        existing.displayName = data.displayName;
        needsSave = true;
      }
      if (needsSave) {
        return this.usersRepository.save(existing);
      }
      return existing;
    }

    // Assign admin role if designated admin or default to citizen
    const isInitialAdmin =
      data.email.toLowerCase().startsWith('admin@') ||
      data.email.toLowerCase().includes('alessito54');

    const newUser = this.usersRepository.create({
      firebaseUid: data.firebaseUid,
      email: data.email,
      displayName:
        data.displayName ||
        data.email.split('@')[0].replace(/[._-]+/g, ' ') ||
        'Ciudadano',
      role: isInitialAdmin ? UserRole.ADMIN : UserRole.CITIZEN,
    });

    return this.usersRepository.save(newUser);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { firebaseUid } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    return this.usersRepository.save(user);
  }

  async updateUser(
    id: string,
    dto: {
      displayName?: string;
      phone?: string;
      role?: UserRole;
      departmentId?: string | null;
    },
  ): Promise<User> {
    const user = await this.findById(id);
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.departmentId !== undefined) {
      user.departmentId = dto.departmentId || null;
    }
    // A citizen account answers for no office, so the attachment is dropped
    // whenever the role is lowered back to citizen.
    if (user.role === UserRole.CITIZEN) {
      user.departmentId = null;
    }
    return this.usersRepository.save(user);
  }

  /** Name and slug of the department an account belongs to, if any. */
  async getDepartmentLabel(
    departmentId: string | null,
  ): Promise<{ id: string; name: string; slug: string } | null> {
    if (!departmentId) return null;
    try {
      const rows = await this.usersRepository.query(
        `SELECT "id", "name", "slug" FROM "departments" WHERE "id" = $1 LIMIT 1`,
        [departmentId],
      );
      return rows[0] || null;
    } catch {
      return null;
    }
  }

  async updateRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    const user = await this.findById(id);
    user.role = dto.role;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    if (user.role === UserRole.ADMIN) {
      throw new Error('No es posible eliminar una cuenta de administrador.');
    }
    await this.usersRepository.delete(id);
    return { success: true, message: 'Usuario eliminado exitosamente.' };
  }

  async findAll(limit = 50, offset = 0): Promise<{ items: any[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    // Query stats for each user
    const userIds = users.map((u) => u.id);
    let paymentCounts: Record<string, number> = {};
    let reportCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      try {
        const pCounts = await this.usersRepository.query(
          `SELECT "user_id", COUNT(*) as count FROM "payments" WHERE "user_id" = ANY($1) GROUP BY "user_id"`,
          [userIds],
        );
        paymentCounts = Object.fromEntries(pCounts.map((r: any) => [r.user_id, Number(r.count)]));

        const rCounts = await this.usersRepository.query(
          `SELECT "user_id", COUNT(*) as count FROM "citizen_reports" WHERE "user_id" = ANY($1) GROUP BY "user_id"`,
          [userIds],
        );
        reportCounts = Object.fromEntries(rCounts.map((r: any) => [r.user_id, Number(r.count)]));
      } catch {
        // Fallback if queries fail
      }
    }

    let departmentNames: Record<string, string> = {};
    try {
      const depts = await this.usersRepository.query(
        `SELECT "id", "name" FROM "departments"`,
      );
      departmentNames = Object.fromEntries(depts.map((d: any) => [d.id, d.name]));
    } catch {
      // The departments table may not exist yet on an un-migrated database.
    }

    const items = users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      phone: u.phone,
      departmentId: u.departmentId,
      departamento: u.departmentId ? departmentNames[u.departmentId] || null : null,
      createdAt: u.createdAt,
      paymentsCount: paymentCounts[u.id] || 0,
      reportsCount: reportCounts[u.id] || 0,
    }));

    return { items, total };
  }
}
