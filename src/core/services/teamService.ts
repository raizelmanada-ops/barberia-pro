// ==========================================================================
// BARBERIA_PRO - Team & Collaborators Repository Service
// Multi-Tenant Staff Management with Isolated Cloud Persistence
// ==========================================================================

import { BarberProfile } from '../types';
import { StorageAdapter } from './storageAdapter';
import { INITIAL_BARBERS } from '../../database/mockData';
import { CloudRepository } from '../repositories/cloudRepository';

const TEAM_STORAGE_KEY = 'tenant_team_members_v3';

export class TeamService {
  private static getAllBarbers(): BarberProfile[] {
    return StorageAdapter.get<BarberProfile[]>(TEAM_STORAGE_KEY, INITIAL_BARBERS);
  }

  /**
   * Get all barbers/collaborators for a specific tenant
   */
  static getTeamByBusiness(businessId: string): BarberProfile[] {
    const all = this.getAllBarbers();
    return all.filter(b => b.businessId === businessId);
  }

  /**
   * Add a new collaborator to a tenant
   */
  static addMember(member: Omit<BarberProfile, 'id' | 'createdAt'>, actor = 'Owner'): BarberProfile {
    const all = this.getAllBarbers();
    const newBarber: BarberProfile = {
      ...member,
      id: `barber_${member.businessId}_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    StorageAdapter.set(TEAM_STORAGE_KEY, [newBarber, ...all]);
    CloudRepository.saveMember(newBarber, actor);
    return newBarber;
  }

  /**
   * Update an existing team member
   */
  static updateMember(member: BarberProfile, actor = 'Owner'): void {
    const all = this.getAllBarbers();
    const index = all.findIndex(b => b.id === member.id && b.businessId === member.businessId);
    if (index !== -1) {
      all[index] = member;
      StorageAdapter.set(TEAM_STORAGE_KEY, all);
      CloudRepository.saveMember(member, actor);
    }
  }

  /**
   * Toggle active/inactive status of a collaborator
   */
  static toggleMemberActive(businessId: string, memberId: string, actor = 'Owner'): void {
    const all = this.getAllBarbers();
    const index = all.findIndex(b => b.id === memberId && b.businessId === businessId);
    if (index !== -1) {
      all[index].isActive = !all[index].isActive;
      StorageAdapter.set(TEAM_STORAGE_KEY, all);
      CloudRepository.saveMember(all[index], actor);
    }
  }

  /**
   * Reset team to seed
   */
  static resetToSeed(): void {
    StorageAdapter.set(TEAM_STORAGE_KEY, INITIAL_BARBERS);
  }
}
