import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { Input } from './Input';
import { Button } from './Button';
import { showAlert } from './CustomAlert';
import { showToast } from './TopToast';
import { updateProfileApi } from '@/lib/services/auth-service';
import { Ionicons } from '@expo/vector-icons';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProfileEditModal({ visible, onClose, onSuccess }: ProfileEditModalProps) {
  const { palette, isDark } = useAppTheme();
  const { user, updateUserSession } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Info fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      const parts = (user.fullName || '').trim().split(' ');
      if (parts.length > 1) {
        setLastName(parts.pop() || '');
        setFirstName(parts.join(' '));
      } else {
        setFirstName(user.fullName || '');
        setLastName('');
      }
      setEmail(user.email || '');
      setPhoneNumber('');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setLoading(false);
    }
  }, [visible, user]);

  const handleSaveInfo = async () => {
    if (!firstName.trim()) {
      showAlert('Eksik Bilgi', 'Lütfen adınızı giriniz.', undefined, 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfileApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (res.success) {
        const updatedFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await updateUserSession({
          fullName: updatedFullName,
          email: email.trim() || user?.email,
        });

        showToast('Başarılı', 'Profil bilgileriniz güncellendi.', 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showAlert('Hata', res.message || 'Profil güncellenemedi.', undefined, 'error');
      }
    } catch {
      showAlert('Hata', 'İşlem sırasında bir hata oluştu.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      showAlert('Eksik Bilgi', 'Lütfen mevcut şifrenizi giriniz.', undefined, 'warning');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showAlert('Eksik Bilgi', 'Yeni şifre en az 4 karakter olmalıdır.', undefined, 'warning');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showAlert('Şifre Uyuşmazlığı', 'Yeni şifreleriniz birbiriyle eşleşmiyor.', undefined, 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfileApi({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        showToast('Başarılı', 'Şifreniz başarıyla güncellendi.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showAlert('Hata', res.message || 'Şifre güncellenemedi.', undefined, 'error');
      }
    } catch {
      showAlert('Hata', 'Şifre güncellenirken bir hata oluştu.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: palette.text }]}>Profili Düzenle</Text>
                <Text style={[styles.modalSub, { color: palette.textSecondary }]}>
                  Kişisel bilgilerinizi ve giriş şifrenizi güncelleyin
                </Text>
              </View>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: palette.borderLight }]} onPress={onClose}>
                <Ionicons name="close" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            {/* Segment Tabs */}
            <View style={[styles.segmentContainer, { backgroundColor: palette.background, borderColor: palette.border }]}>
              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  activeTab === 'info' && {
                    backgroundColor: palette.primary,
                    shadowColor: palette.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
                onPress={() => setActiveTab('info')}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={activeTab === 'info' ? '#FFFFFF' : palette.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: activeTab === 'info' ? '#FFFFFF' : palette.textSecondary, fontWeight: activeTab === 'info' ? '700' : '600' },
                  ]}
                >
                  Bilgilerim
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  activeTab === 'password' && {
                    backgroundColor: palette.primary,
                    shadowColor: palette.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
                onPress={() => setActiveTab('password')}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={activeTab === 'password' ? '#FFFFFF' : palette.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: activeTab === 'password' ? '#FFFFFF' : palette.textSecondary, fontWeight: activeTab === 'password' ? '700' : '600' },
                  ]}
                >
                  Şifre Değiştir
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {activeTab === 'info' ? (
                <View style={styles.formSection}>
                  <View style={styles.nameRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Ad"
                        placeholder="Adınız"
                        value={firstName}
                        onChangeText={setFirstName}
                        icon="person-outline"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Soyad"
                        placeholder="Soyadınız"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>

                  <Input
                    label="E-Posta Adresi"
                    placeholder="ornek@kursum.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                  />

                  <Input
                    label="Telefon Numarası (İsteğe Bağlı)"
                    placeholder="05XX XXX XX XX"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    icon="call-outline"
                  />

                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={loading ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
                      onPress={handleSaveInfo}
                      disabled={loading}
                      icon={<Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <Input
                    label="Mevcut Şifre"
                    placeholder="Mevcut şifrenizi giriniz"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    icon="lock-closed-outline"
                  />

                  <Input
                    label="Yeni Şifre"
                    placeholder="En az 4 karakter"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    icon="key-outline"
                  />

                  <Input
                    label="Yeni Şifre Tekrar"
                    placeholder="Yeni şifrenizi tekrar giriniz"
                    value={newPasswordConfirm}
                    onChangeText={setNewPasswordConfirm}
                    secureTextEntry
                    icon="key-outline"
                  />

                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                      onPress={handleSavePassword}
                      disabled={loading}
                      icon={<Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  formSection: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
