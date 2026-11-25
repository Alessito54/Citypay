import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * Emails that get the admin role when their account is first created, from ADMIN_EMAILS
   * (comma-separated, exact match).
   */
  private adminEmails(): Set<string> {
    return new Set(
      (process.env.ADMIN_EMAILS ?? 'admin@citypay.gob.mx,admin@orizaba.gob.mx')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  async syncUser(data: {
    firebaseUid: string;
    email: string;
    displayName?: string;
    emailVerified?: boolean;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    let existing = await this.usersRepository.findOne({ where: { firebaseUid: data.firebaseUid } });

    if (!existing) {
      const byEmail = await this.usersRepository.findOne({ where: { email } });
      if (byEmail) {
        if (!data.emailVerified) {
          throw new ConflictException(
            'Ya existe un perfil con este correo. Verifica tu correo electrónico para vincular la cuenta.',
          );
        }
        byEmail.firebaseUid = data.firebaseUid;
        existing = await this.usersRepository.save(byEmail);
      }
    }

    if (existing) {
      if (data.displayName && existing.displayName !== data.displayName) {
        existing.displayName = data.displayName;
        return this.usersRepository.save(existing);
      }
      return existing;
    }

    const isAdmin = Boolean(data.emailVerified) && this.adminEmails().has(email);

    const newUser = this.usersRepository.create({
      firebaseUid: data.firebaseUid,
      email,
      displayName:
        data.displayName ||
        email.split('@')[0].replace(/[._-]+/g, ' ') ||
        'Ciudadano',
      role: isAdmin ? UserRole.ADMIN : UserRole.CITIZEN,
      department: null,
    });

    try {
      return await this.usersRepository.save(newUser);
    } catch (err: any) {
      const raced = await this.usersRepository.findOne({
        where: [{ firebaseUid: data.firebaseUid }, { email }],
      });
      if (raced) return raced;
      throw err;
    }
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { firebaseUid } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const hasMunicipalFields =
      dto.cadastralKey !== undefined ||
      dto.propertyAddress !== undefined ||
      dto.propertyType !== undefined ||
      dto.waterAccount !== undefined ||
      dto.vehiclePlates !== undefined ||
      dto.driverLicense !== undefined;

    if (hasMunicipalFields) {
      user.municipalData = {
        ...(user.municipalData ?? {}),
        ...(dto.cadastralKey !== undefined ? { cadastralKey: dto.cadastralKey.trim() } : {}),
        ...(dto.propertyAddress !== undefined ? { propertyAddress: dto.propertyAddress.trim() } : {}),
        ...(dto.propertyType !== undefined ? { propertyType: dto.propertyType } : {}),
        ...(dto.waterAccount !== undefined ? { waterAccount: dto.waterAccount.trim() } : {}),
        ...(dto.vehiclePlates !== undefined ? { vehiclePlates: dto.vehiclePlates.trim().toUpperCase() } : {}),
        ...(dto.driverLicense !== undefined ? { driverLicense: dto.driverLicense.trim() } : {}),
      };
    }

    return this.usersRepository.save(user);
  }

  async updateRoleAndDepartment(
    id: string,
    dto: UpdateUserRoleDto,
    actor: User,
  ): Promise<User> {
    const target = await this.findById(id);
    const actorIsAdmin = actor.role === UserRole.ADMIN;

    // Recursos Humanos solo puede gestionar personal no-administrador y no puede otorgar rol admin
    if (!actorIsAdmin) {
      if (target.role === UserRole.ADMIN || dto.role === UserRole.ADMIN) {
        throw new ForbiddenException(
          'Recursos Humanos no tiene permisos para modificar ni otorgar cuentas de Administrador general.',
        );
      }
    }

    if (dto.role !== undefined) {
      target.role = dto.role;
    }
    if (dto.department !== undefined) {
      target.department = dto.department ? dto.department : null;
    }
    if (target.role === UserRole.CITIZEN) {
      target.department = null;
    }

    return this.usersRepository.save(target);
  }

  async updateSelfPreviewRole(userId: string, dto: UpdateUserRoleDto): Promise<User> {
    const user = await this.findById(userId);
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.department !== undefined) user.department = dto.department ? dto.department : null;
    if (user.role === UserRole.CITIZEN) user.department = null;
    return this.usersRepository.save(user);
  }

  async findAll(limit = 50, offset = 0): Promise<{ items: User[]; total: number }> {
    const [items, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }
}
