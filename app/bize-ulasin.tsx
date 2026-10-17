import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { showToast } from '@/components/ui/TopToast';
import { Card } from '@/components/ui/Card';
import { sendContactMessage } from '@/lib/services/contact-service';

interface SubjectOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  { id: 'Şikayet', label: 'Şikayet', icon: 'alert-circle', color: '#EF4444' },
  { id: 'Öneri', label: 'Öneri', icon: 'bulb-outline', color: '#F59E0B' },
  { id: 'Hata Bildirimi', label: 'Hata Bildirimi', icon: 'bug-outline', color: '#EC4899' },
  { id: 'Genel Bilgi', label: 'Genel Bilgi', icon: 'information-circle-outline', color: '#3B82F6' },
  { id: 'Diğer', label: 'Diğer', icon: 'chatbubbles-outline', color: '#8B5CF6' },
];

export default function BizeUlasinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSubjectItem = useMemo(
    () => SUBJECT_OPTIONS.find((s) => s.id === subject),
    [subject]
  );

  const handleSubmit = async () => {
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = userEmail.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      setErrorMessage('Lütfen mesajınız için bir konu seçin.');
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage('Lütfen iletmek istediğiniz mesajı yazın.');
      return;
    }

    if (trimmedMessage.length < 5) {
      setErrorMessage('Mesajınız en az 5 karakter olmalıdır.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Ad soyad alanı gereklidir.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('E-posta adresi gereklidir.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Geçerli bir e-posta adresi girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendContactMessage({
        fullName: trimmedName,
        userEmail: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      if (res.success) {
        showToast('Mesajınız İletildi', res.message || 'Destek ekibimiz en kısa sürede dönüş yapacaktır.', 'success');
        setSubject('');
        setMessage('');
        router.back();
      } else {
        setErrorMessage(res.message || 'Mesaj iletilemedi. Lütfen tekrar deneyin.');
        showToast('Gönderilemedi', res.message, 'error');
      }
    } catch {
      setErrorMessage('Beklenmedik bir bağlantı hatası oluştu.');
      showToast('Bağlantı Hatası', 'Lütfen internet bağlantınızı kontrol edin.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 28),
            backgroundColor: palette.background,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Geri Dön"
        >
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Bize Ulaşın</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
            Şikayet, öneri veya geri bildirim
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Card */}
          <Card
            style={[
              styles.infoBanner,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE',
              },
            ]}
          >
            <View style={styles.bannerRow}>
              <View style={[styles.bannerIconBox, { backgroundColor: palette.primary }]}>
                <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.bannerTitle, { color: palette.text }]}>
                  Size Nasıl Yardımcı Olabiliriz?
                </Text>
                <Text style={[styles.bannerText, { color: palette.textSecondary }]}>
                  Uygulama deneyiminiz, kurs süreçleriniz, şikayet ve önerileriniz doğrudan destek ekibimize iletilir.
                </Text>
              </View>
            </View>
          </Card>

          {/* Form Card */}
          <Card style={[styles.formCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {/* Ad Soyad */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>AD SOYAD</Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <Ionicons name="person-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.inputField, { color: palette.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Adınız ve soyadınız"
                  placeholderTextColor={palette.textMuted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* E-posta */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>E-POSTA ADRESİ</Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.inputField, { color: palette.text }]}
                  value={userEmail}
                  onChangeText={setUserEmail}
                  placeholder="ornek@kursum.com"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Konu Seçimi */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>KONU SEÇİN</Text>
              <TouchableOpacity
                style={[
                  styles.inputShell,
                  styles.selectShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: subject ? palette.primary : palette.border,
                  },
                ]}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {selectedSubjectItem ? (
                  <View style={styles.selectedSubjectRow}>
                    <View
                      style={[
                        styles.subjectBadge,
                        { backgroundColor: selectedSubjectItem.color + (isDark ? '33' : '20') },
                      ]}
                    >
                      <Ionicons
                        name={selectedSubjectItem.icon}
                        size={16}
                        color={selectedSubjectItem.color}
                      />
                    </View>
                    <Text style={[styles.selectedSubjectText, { color: palette.text }]}>
                      {selectedSubjectItem.label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.selectedSubjectRow}>
                    <Ionicons name="list-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                    <Text style={[styles.placeholderText, { color: palette.textMuted }]}>
                      Bir konu başlığı seçin
                    </Text>
                  </View>
                )}

                <Ionicons name="chevron-down" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Mesaj */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelCounterRow}>
                <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>MESAJINIZ</Text>
                <Text style={[styles.charCounter, { color: palette.textMuted }]}>
                  {message.length} / 8000
                </Text>
              </View>
              <View
                style={[
                  styles.inputShell,
                  styles.textAreaShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.textAreaField, { color: palette.text }]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Şikayet, öneri veya detaylı mesajınızı buraya yazın..."
                  placeholderTextColor={palette.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={8000}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: palette.primary },
                isSubmitting && { opacity: 0.75 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.btnInner}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitBtnText}>Gönderiliyor...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Mesajı Gönder</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>

          {/* Destek Bilgilendirme */}
          <View style={styles.supportFooter}>
            <Ionicons name="shield-checkmark-outline" size={16} color={palette.textMuted} />
            <Text style={[styles.supportFooterText, { color: palette.textSecondary }]}>
              MasavTech Destek Ekibi mesajınızı inceleyip sistemde kayıtlı e-posta adresinize dönüş sağlayacaktır.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Subject Picker Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalIndicator, { backgroundColor: palette.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Konu Başlığı Seçin</Text>
              <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                Mesajınızın daha hızlı yanıtlanması için uygun kategoriyi seçin
              </Text>
            </View>

            <View style={styles.modalOptionsList}>
              {SUBJECT_OPTIONS.map((item) => {
                const isSelected = subject === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalOptionItem,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF')
                          : (isDark ? '#111827' : '#F8FAFC'),
                        borderColor: isSelected ? palette.primary : palette.border,
                      },
                    ]}
                    onPress={() => {
                      setSubject(item.id);
                      setIsModalVisible(false);
                      setErrorMessage(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionLeft}>
                      <View
                        style={[
                          styles.subjectBadge,
                          { backgroundColor: item.color + (isDark ? '33' : '20') },
                        ]}
                      >
                        <Ionicons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text
                        style={[
                          styles.modalOptionLabel,
                          {
                            color: isSelected ? palette.primary : palette.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={palette.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                },
              ]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: palette.textSecondary }]}>Kapat</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  formCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  labelCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginLeft: 2,
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  selectShell: {
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    justifyContent: 'space-between',
  },
  selectedSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subjectBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSubjectText: {
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaShell: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaField: {
    width: '100%',
    minHeight: 130,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  supportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 12,
  },
  supportFooterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
  },
  modalIndicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOptionsList: {
    gap: 8,
    marginBottom: 16,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionLabel: {
    fontSize: 14,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
