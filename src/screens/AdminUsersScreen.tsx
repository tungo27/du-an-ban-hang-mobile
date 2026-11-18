import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchUsers,
  updateUserRole,
  toggleBlockUser,
  deleteUser,
  getCurrentUser,
  notifyAuthChanged,
  isAdminRole,
  isSuperAdminRole,
  User,
  UserRole,
} from '../data/database';
import Header from '../components/Header';
import { showAlert, showConfirm } from '../utils/alertHelper';

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'user', label: 'Customer', icon: 'person-outline', color: '#2563EB' },
  { value: 'admin', label: 'Admin', icon: 'shield-half', color: '#7C3AED' },
  {
    value: 'superadmin',
    label: 'Super Admin',
    icon: 'shield-checkmark',
    color: '#B91C1C',
  },
];

const getRoleMeta = (role?: string) => {
  if (role === 'superadmin') {
    return {
      label: 'SUPER ADMIN',
      color: '#B91C1C',
      bg: '#FEE2E2',
      icon: 'shield-checkmark' as const,
    };
  }
  if (role === 'admin') {
    return {
      label: 'ADMIN',
      color: '#7C3AED',
      bg: '#F3E8FF',
      icon: 'shield-half' as const,
    };
  }
  return {
    label: 'CUSTOMER',
    color: '#2563EB',
    bg: '#DBEAFE',
    icon: 'person-outline' as const,
  };
};

const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadUsers = useCallback(async () => {
    const curr = await getCurrentUser();
    setCurrentUser(curr);
    setHeaderKey((prev) => prev + 1);

    if (!isAdminRole(curr?.role)) {
      showAlert(
        'Access Denied (RBAC)',
        'Only administrators can manage user accounts.',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    setUsers(await fetchUsers());
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const isSuperAdmin = isSuperAdminRole(currentUser?.role);

  const handleChangeRole = (target: User, nextRole: UserRole) => {
    if (!isSuperAdmin) {
      showAlert(
        'Permission Denied',
        'Only the Super Admin can change user roles.'
      );
      return;
    }
    if (target.id === currentUser?.id) {
      showAlert('Not Allowed', 'You cannot change your own role.');
      return;
    }
    if (target.role === nextRole) {
      setRoleTarget(null);
      return;
    }

    showConfirm(
      'Change Role',
      `Change "${target.fullName} (@${target.username})" from ${String(
        target.role
      ).toUpperCase()} to ${nextRole.toUpperCase()}?`,
      async () => {
        setRoleTarget(null);
        await updateUserRole(target.id, nextRole);
        await notifyAuthChanged();
        await loadUsers();
        showAlert(
          'Role Updated',
          `@${target.username} is now ${nextRole.toUpperCase()}.`
        );
      }
    );
  };

  const handleToggleBlockUser = (target: User) => {
    if (target.id === currentUser?.id) {
      showAlert('Not Allowed', 'You cannot block your own account.');
      return;
    }
    if (!isSuperAdmin && isAdminRole(target.role)) {
      showAlert(
        'Permission Denied',
        'Admin accounts can only block Customer accounts.'
      );
      return;
    }

    const isCurrentlyBlocked = target.isBlocked === 1 || target.isBlocked === true;
    const nextBlockState = !isCurrentlyBlocked;

    showConfirm(
      nextBlockState ? 'Block Account' : 'Unblock Account',
      nextBlockState
        ? `Block "${target.fullName} (@${target.username})"? Blocked users cannot sign in.`
        : `Unblock "${target.fullName} (@${target.username})" so they can sign in again?`,
      async () => {
        await toggleBlockUser(target.id, nextBlockState);
        await loadUsers();
        showAlert(
          nextBlockState ? 'Account Blocked' : 'Account Unblocked',
          `@${target.username} has been ${
            nextBlockState ? 'blocked' : 'unblocked'
          } successfully.`
        );
      }
    );
  };

  const handleDeleteUser = (target: User) => {
    if (!isSuperAdmin) {
      showAlert(
        'Permission Denied',
        'Only the Super Admin can permanently delete accounts.'
      );
      return;
    }
    if (target.id === currentUser?.id) {
      showAlert('Not Allowed', 'You cannot delete your own account.');
      return;
    }

    showConfirm(
      'Delete Account',
      `Permanently delete "${target.fullName} (@${target.username})"? This action cannot be undone.`,
      async () => {
        await deleteUser(target.id);
        await loadUsers();
        showAlert('Account Deleted', `@${target.username} has been removed.`);
      }
    );
  };

  if (!isAdminRole(currentUser?.role)) {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="RBAC Security - User Management" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Header key={headerKey} subtitle="User Management" />

            <View style={styles.topInfo}>
              <View style={styles.titleRow}>
                <Ionicons name="people-outline" size={18} color="#1E3A8A" />
                <Text style={styles.title}>USER ACCOUNTS ({users.length})</Text>
              </View>
              <View style={styles.noticeBox}>
                <Ionicons
                  name={isSuperAdmin ? 'shield-checkmark' : 'shield-half'}
                  size={14}
                  color={isSuperAdmin ? '#B91C1C' : '#7C3AED'}
                />
                <Text style={styles.noticeText}>
                  {isSuperAdmin
                    ? 'Super Admin: full rights to change roles, block and delete accounts.'
                    : 'Admin: can only block Customer accounts (role changes and deletion are restricted).'}
                </Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const meta = getRoleMeta(item.role);
          const isBlocked = item.isBlocked === 1 || item.isBlocked === true;
          const isSelf = item.id === currentUser?.id;
          const canManageRole = isSuperAdmin && !isSelf;
          const canBlock = !isSelf && (isSuperAdmin || !isAdminRole(item.role));
          const canDelete = isSuperAdmin && !isSelf;

          return (
            <View style={[styles.userCard, isBlocked && styles.userCardBlocked]}>
              <View style={styles.userHeaderRow}>
                <View style={styles.userTitleCol}>
                  <Text style={styles.fullName}>{item.fullName}</Text>
                  <Text style={styles.username}>@{item.username} | ID #{item.id}</Text>
                </View>
                <View style={styles.badgesGroup}>
                  <View style={[styles.roleBadge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={11} color={meta.color} />
                    <Text style={[styles.roleBadgeText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isBlocked ? styles.statusBlocked : styles.statusActive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Email: </Text>
                {item.email || 'Not updated'}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Phone: </Text>
                {item.phone || 'Not updated'} | <Text style={styles.detailLabel}>Address: </Text>
                {item.address || 'Not updated'}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.roleBtn, !canManageRole && styles.actionDisabled]}
                  onPress={() => setRoleTarget(item)}
                  disabled={!canManageRole}
                >
                  <Ionicons name="swap-horizontal-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Change Role</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isBlocked ? styles.unblockBtn : styles.blockBtn,
                    !canBlock && styles.actionDisabled,
                  ]}
                  onPress={() => handleToggleBlockUser(item)}
                  disabled={!canBlock}
                >
                  <Ionicons
                    name={isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionBtnText}>
                    {isBlocked ? 'Unblock' : 'Block'}
                  </Text>
                </TouchableOpacity>

                {isSuperAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.deleteBtn,
                      !canDelete && styles.actionDisabled,
                    ]}
                    onPress={() => handleDeleteUser(item)}
                    disabled={!canDelete}
                  >
                    <Ionicons name="trash-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={roleTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>CHANGE ROLE</Text>
            <Text style={styles.modalSub}>
              {roleTarget?.fullName} (@{roleTarget?.username})
            </Text>

            {ROLE_OPTIONS.map((option) => {
              const active = roleTarget?.role === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.roleOption, active && styles.roleOptionActive]}
                  onPress={() => roleTarget && handleChangeRole(roleTarget, option.value)}
                >
                  <Ionicons name={option.icon} size={18} color={option.color} />
                  <Text style={styles.roleOptionText}>{option.label}</Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={18} color={option.color} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setRoleTarget(null)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 24 },
  topInfo: { paddingHorizontal: 14, paddingVertical: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardBlocked: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  userTitleCol: { flex: 1, marginRight: 8 },
  badgesGroup: { gap: 5, alignItems: 'flex-end' },
  fullName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  username: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: { fontSize: 10, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusBlocked: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  detailText: { fontSize: 12, color: '#475569', marginBottom: 3 },
  detailLabel: { fontWeight: 'bold', color: '#334155' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  roleBtn: { backgroundColor: '#7C3AED' },
  blockBtn: { backgroundColor: '#D97706' },
  unblockBtn: { backgroundColor: '#16A34A' },
  deleteBtn: { backgroundColor: '#DC2626' },
  actionDisabled: { opacity: 0.35 },
  actionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  roleOptionActive: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  roleOptionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  modalCloseBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCloseText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
});

export default AdminUsersScreen;
