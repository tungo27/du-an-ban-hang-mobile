import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchUsers,
  updateUserRole,
  toggleBlockUser,
  deleteUser,
  getCurrentUser,
  User,
} from '../data/database';
import { notifyAuthChanged } from '../navigation/BottomTabNavigator';
import Header from '../components/Header';
import { showAlert, showConfirm } from '../utils/alertHelper';

const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadUsers = useCallback(async () => {
    const curr = await getCurrentUser();
    setCurrentUser(curr);
    setCurrentUserId(curr?.id);
    setHeaderKey((prev) => prev + 1);

    if (!curr || curr.role !== 'admin') {
      showAlert(
        'Truy cập bị từ chối (RBAC)',
        'Chỉ Quản trị viên (Admin) mới có quyền quản lý tài khoản người dùng!',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    const list = await fetchUsers();
    setUsers(list);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleToggleRole = (u: User) => {
    const newRole: 'admin' | 'user' = u.role === 'admin' ? 'user' : 'admin';
    showConfirm(
      'Cập nhật vai trò',
      `Bạn muốn đổi vai trò của "${u.fullName} (@${u.username})" từ ${u.role.toUpperCase()} sang ${newRole.toUpperCase()}?`,
      async () => {
        await updateUserRole(u.id, newRole);
        await notifyAuthChanged();
        await loadUsers();
        showAlert(
          'Thành công',
          `Đã cập nhật vai trò của @${u.username} thành ${newRole.toUpperCase()}.`
        );
      }
    );
  };

  // Không xóa user mà chỉ Chặn / Mở chặn người dùng
  const handleToggleBlockUser = (u: User) => {
    if (u.id === currentUserId) {
      showAlert(
        'Không thể tự chặn',
        'Bạn không thể tự chặn tài khoản Quản trị viên đang đăng nhập hiện tại!'
      );
      return;
    }

    const isCurrentlyBlocked = u.isBlocked === 1 || u.isBlocked === true;
    const nextBlockState = !isCurrentlyBlocked;

    showConfirm(
      nextBlockState ? 'Xác nhận Chặn người dùng' : 'Mở chặn người dùng',
      nextBlockState
        ? `Bạn có chắc muốn CHẶN tài khoản "${u.fullName} (@${u.username})"? Người dùng bị chặn sẽ không thể đăng nhập vào hệ thống.`
        : `Bạn muốn MỞ CHẶN cho tài khoản "${u.fullName} (@${u.username})" hoạt động trở lại?`,
      async () => {
        await toggleBlockUser(u.id, nextBlockState);
        await loadUsers();
        showAlert(
          nextBlockState ? 'Đã chặn người dùng' : 'Đã mở chặn',
          nextBlockState
            ? `Tài khoản @${u.username} đã bị chặn đăng nhập.`
            : `Tài khoản @${u.username} đã được mở khóa hoạt động bình thường.`
        );
      }
    );
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUserId) {
      showAlert(
        'Không thể tự xóa',
        'Bạn không thể tự xóa tài khoản Quản trị viên đang đăng nhập hiện tại!'
      );
      return;
    }

    showConfirm(
      'Xác nhận xóa người dùng',
      `Bạn có chắc chắn muốn XÓA tài khoản "${u.fullName} (@${u.username})" khỏi cơ sở dữ liệu?`,
      async () => {
        await deleteUser(u.id);
        await loadUsers();
        showAlert(
          'Đã xóa người dùng',
          `Đã xóa tài khoản @${u.username} thành công.`
        );
      }
    );
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="Bảo mật RBAC - Quản trị User" />
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
            <Header
              key={headerKey}
              subtitle="Quản trị User (Xem, Đổi vai trò, Chặn/Mở chặn)"
            />
            <View style={styles.topInfo}>
              <Text style={styles.title}>
                DANH SÁCH NGƯỜI DÙNG ({users.length} TÀI KHOẢN)
              </Text>
              <Text style={styles.subTitle}>
                Admin chỉ thực hiện Đổi vai trò (Admin/User) hoặc Chặn / Mở chặn người dùng (không xóa tài khoản khỏi CSDL).
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isAdmin = item.role === 'admin';
          const isBlocked = item.isBlocked === 1 || item.isBlocked === true;
          return (
            <View
              style={[
                styles.userCard,
                isBlocked && styles.userCardBlocked,
              ]}
            >
              <View style={styles.userHeaderRow}>
                <View style={styles.userTitleCol}>
                  <Text style={styles.fullName}>{item.fullName}</Text>
                  <Text style={styles.username}>
                    Username: @{item.username} | ID: #{item.id}
                  </Text>
                </View>
                <View style={styles.badgesGroup}>
                  <View
                    style={[
                      styles.roleBadge,
                      isAdmin ? styles.badgeAdmin : styles.badgeUser,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>
                      {isAdmin ? 'ADMIN' : 'USER'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isBlocked ? styles.statusBlocked : styles.statusActive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {isBlocked ? 'ĐÃ BỊ CHẶN' : 'HOẠT ĐỘNG'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailText}>Email: {item.email}</Text>
              <Text style={styles.detailText}>
                SĐT: {item.phone || 'Chưa cập nhật'} | Địa chỉ:{' '}
                {item.address || 'Chưa cập nhật'}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.roleSwitchBtn,
                    isAdmin ? styles.switchToUserBtn : styles.switchToAdminBtn,
                  ]}
                  onPress={() => handleToggleRole(item)}
                >
                  <Text style={styles.roleSwitchBtnText}>
                    {isAdmin
                      ? 'Đổi vai trò sang USER'
                      : 'Đổi vai trò sang ADMIN'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.blockBtn,
                    isBlocked ? styles.unblockBtn : styles.blockWarnBtn,
                  ]}
                  onPress={() => handleToggleBlockUser(item)}
                >
                  <Text style={styles.blockBtnText}>
                    {isBlocked ? 'Mở chặn' : 'Chặn'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.blockBtn, styles.blockDangerBtn]}
                  onPress={() => handleDeleteUser(item)}
                >
                  <Text style={styles.blockBtnText}>Xóa User</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 24,
  },
  topInfo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardBlocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  userTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  fullName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  username: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAdmin: {
    backgroundColor: '#7C3AED',
  },
  badgeUser: {
    backgroundColor: '#2563EB',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#16A34A',
  },
  statusBlocked: {
    backgroundColor: '#DC2626',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  roleSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  switchToAdminBtn: {
    backgroundColor: '#7C3AED',
  },
  switchToUserBtn: {
    backgroundColor: '#0284C7',
  },
  roleSwitchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  blockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  blockDangerBtn: {
    backgroundColor: '#DC2626',
  },
  blockWarnBtn: {
    backgroundColor: '#D97706',
  },
  unblockBtn: {
    backgroundColor: '#16A34A',
  },
  blockBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AdminUsersScreen;
