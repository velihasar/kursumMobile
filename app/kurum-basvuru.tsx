import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/theme-context';
import { showAlert } from '@/components/ui/CustomAlert';
import { showToast } from '@/components/ui/TopToast';
import { Card } from '@/components/ui/Card';
import { sendInstitutionRegistration } from '@/lib/services/contact-service';

const STUDENT_COUNT_OPTIONS = [
  '1 - 50',
  '50 - 150',
  '150 - 300',
  '300+',
];

export default function KurumBasvuruScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, isDark } = useAppTheme();

  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [studentCount, setStudentCount] = useState(STUDENT_COUNT_OPTIONS[1]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedInstName = institutionName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      setErrorMessage('Lütfen yetkili ad soyad alanını doldurunuz.');
      return;
    }

    if (!trimmedInstName) {
      setErrorMessage('Lütfen kurum veya kurs adını giriniz.');
      return;
    }

    if (!trimmedPhone) {
      setErrorMessage('Lütfen telefon numaranızı giriniz.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendInstitutionRegistration({
        fullName: trimmedFullName,
        institutionName: trimmedInstName,
        phone: trimmedPhone,
        email: trimmedEmail,
        city: city.trim(),
        studentCount,
        message: message.trim(),
      });

      if (res.success) {
        showToast('Başvuru Alındı', 'Talebiniz yetkililerimize iletildi.', 'success');
        showAlert(
          'Başvurunuz Alındı!',
          `${trimmedInstName} kurum kaydı talebiniz başarıyla alınmıştır.\n\nKurum kurulumu ve demo aktivasyonu için yetkili ekibimiz sizinle en kısa sürede iletişime geçecektir.`,
          [
            {
              text: 'Tamam',
              onPress: () => router.back(),
            },
          ],
          'success',
          'checkmark-circle-outline'
        );
      } else {
        setErrorMessage(res.message || 'Başvuru iletilemedi. Lütfen tekrar deneyiniz.');
        showToast('Hata', res.message, 'error');
      }
    } catch {
      setErrorMessage('Sunucuya bağlanırken bir hata oluştu.');
      showToast('Bağlantı Hatası', 'Lütfen internet bağlantınızı kontrol edin.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
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
        >
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Kurum Başvurusu</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
            Kurumunuzu Kursum'a dahil edin
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
          {/* Hero Card */}
          <Card
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
              },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={[styles.heroIconBox, { backgroundColor: palette.primary }]}>
                <Ionicons name="business" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.heroTitle, { color: palette.text }]}>
                  Kurumunuzu Dijitalleştirin
                </Text>
                <Text style={[styles.heroText, { color: palette.textSecondary }]}>
                  Ders programı, yoklama, kantin cüzdanı ve veli iletişimini tek platformda toplayın.
                </Text>
              </View>
            </View>
          </Card>

          {/* Form Card */}
          <Card style={[styles.formCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {/* Yetkili Ad Soyad */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>YETKİLİ AD SOYAD *</Text>
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
                  placeholder="Yetkili kişinin adını ve soyadını yazınız"
                  placeholderTextColor={palette.textMuted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Kurum Adı */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>KURUM / KURS ADI *</Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <Ionicons name="school-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.inputField, { color: palette.text }]}
                  value={institutionName}
                  onChangeText={setInstitutionName}
                  placeholder="Kurumunuzun resmi veya tabela adını yazınız"
                  placeholderTextColor={palette.textMuted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Telefon */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>TELEFON NUMARASI *</Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <Ionicons name="call-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.inputField, { color: palette.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Size ulaşabileceğimiz güncel telefon numaranız"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* E-posta */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>E-POSTA ADRESİ *</Text>
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Bilgilendirme için aktif e-posta adresiniz"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Şehir / Lokasyon */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>ŞEHİR / İLÇE</Text>
              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    borderColor: palette.border,
                  },
                ]}
              >
                <Ionicons name="location-outline" size={18} color={palette.textMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.inputField, { color: palette.text }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Kurumun bulunduğu il ve ilçeyi yazınız"
                  placeholderTextColor={palette.textMuted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Tahmini Öğrenci Sayısı */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>TAHMİNİ ÖĞRENCİ SAYISI</Text>
              <View style={styles.pillRow}>
                {STUDENT_COUNT_OPTIONS.map((opt) => {
                  const isSelected = studentCount === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.pillBtn,
                        {
                          backgroundColor: isSelected
                            ? palette.primary
                            : isDark ? '#111827' : '#F8FAFC',
                          borderColor: isSelected ? palette.primary : palette.border,
                        },
                      ]}
                      onPress={() => setStudentCount(opt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSelected ? '#FFFFFF' : palette.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ek Açıklama */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>EK AÇIKLAMA / TALEPLER</Text>
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
                  placeholder="Şube sayısı, öğrenci yapısı veya sormak istediğiniz tüm detayları buraya yazabilirsiniz..."
                  placeholderTextColor={palette.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
                  <Text style={styles.submitBtnText}>Talebiniz İletiliyor...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="send" size={17} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Başvuru Talebini Gönder</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  heroCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  formCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginLeft: 2,
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
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
  },
  textAreaShell: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaField: {
    width: '100%',
    minHeight: 80,
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
    marginTop: 6,
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
});
