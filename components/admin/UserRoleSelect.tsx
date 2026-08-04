'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Select } from '@/components/ui/select';
import { updateUserRole } from '@/lib/actions/admin-users';
import type { UserRole } from '@/lib/supabase/types';

const ROLES: UserRole[] = ['user', 'editor', 'admin', 'super_admin'];

export function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRole({ userId, role });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Role updated.');
      router.refresh();
    });
  }

  return (
    <Select
      value={currentRole}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      className="h-9 w-40 text-xs"
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {role.replace('_', ' ')}
        </option>
      ))}
    </Select>
  );
}
