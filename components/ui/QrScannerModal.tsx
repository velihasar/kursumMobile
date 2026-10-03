import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/theme-context';
import { ChildStudent } from '@/lib/services/student-service';
import { submitQrCheckIn } from '@/lib/services/qr-attendance-service';
import { showAlert } from './CustomAlert';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  students: ChildStudent[];
  initialStudentId?: number;
  onSuccess?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_BOX_SIZE = SCREEN_WIDTH * 0.72;

export function QrScannerModal({
  visible,
  onClose,
  students,
  initialStudentId,
  onSuccess,
}: QrScannerModalProps) {
  const { palette, isDark } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(initialStudentId);
  const [torch, setTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    title: string;
    message: string;
  } | null>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
      } else if (students.length > 0) {
        setSelectedStudentId(students[0].id);
      }
      setIsProcessing(false);
      setScanResult(null);

      // Start scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_BOX_SIZE - 6,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setTorch(false);
      scanLineAnim.setValue(0);
    }
  }, [visible, initialStudentId, students]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || scanResult) return;
    if (!selectedStudentId) {
      showAlert('Öğrenci Seçilmedi', 'Lütfen yoklama vermek için bir öğrenci seçiniz.', undefined, 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const res = await submitQrCheckIn({
        studentId: selectedStudentId,
        qrCode: data,
      });

      if (res.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setScanResult({
          success: true,
          title: 'Yoklama Alındı',
          message: res.message || 'Öğrencinin derse girişi başarıyla kaydedildi.',
        });
        if (onSuccess) onSuccess();
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setScanResult({
          success: false,
          title: 'Giriş Başarısız',
          message: res.message || 'Geçerli bir ders saati aralığında değilsiniz.',
        });
      }
    } catch {
      setScanResult({
        success: false,
        title: 'Hata',
        message: 'QR kod işlenirken bir sorun oluştu.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setIsProcessing(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={[styles.permissionContainer, { backgroundColor: palette.background }]}>
            <View style={[styles.permissionIconBadge, { backgroundColor: palette.primaryLight }]}>
              <Ionicons name="camera" size={48} color={palette.primary} />
            </View>
            <Text style={[styles.permissionTitle, { color: palette.text }]}>Kamera İzni Gerekli</Text>
            <Text style={[styles.permissionDesc, { color: palette.textSecondary }]}>
              Kurum masasında bulunan yoklama QR kodunu tarayabilmek için kamera erişimine izin vermeniz gerekmektedir.
            </Text>
            <TouchableOpacity
              style={[styles.permissionBtn, { backgroundColor: palette.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>İzin Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: palette.textMuted }]}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isProcessing || scanResult ? undefined : handleBarcodeScanned}
            />

            {/* Dark Vignette Overlay with transparent cutout */}
            <View style={styles.overlay}>
              {/* Header Bar */}
              <View style={styles.topHeaderBar}>
                <TouchableOpacity style={styles.roundActionBtn} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>QR ile Yoklama</Text>

                <TouchableOpacity
                  style={[styles.roundActionBtn, torch && styles.torchActiveBtn]}
                  onPress={() => setTorch(!torch)}
                >
                  <Ionicons name={torch ? 'flash' : 'flash-off'} size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Multi-Student Selector Chips if parent has multiple students */}
              {students.length > 1 && (
                <View style={styles.studentChipsRow}>
                  {students.map((st) => {
                    const isSelected = selectedStudentId === st.id;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.studentChip,
                          isSelected && { backgroundColor: palette.primary, borderColor: palette.primary },
                        ]}
                        onPress={() => setSelectedStudentId(st.id)}
                      >
                        <Ionicons
                          name="person"
                          size={14}
                          color={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                        />
                        <Text
                          style={[
                            styles.studentChipText,
                            isSelected && { color: '#FFFFFF', fontWeight: '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {st.fullName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Target Scan Box */}
              <View style={styles.scanBoxContainer}>
                <View style={styles.scanBox}>
                  {/* Corner Borders */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Animated Laser Line */}
                  {!scanResult && !isProcessing && (
                    <Animated.View
                      style={[
                        styles.laserLine,
                        {
                          transform: [{ translateY: scanLineAnim }],
                        },
                      ]}
                    />
                  )}

                  {isProcessing && (
                    <View style={styles.processingBox}>
                      <ActivityIndicator size="large" color="#2C98F6" />
                      <Text style={styles.processingText}>Doğrulanıyor...</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom Instructions or Result Sheet */}
              <View style={styles.bottomArea}>
                {scanResult ? (
                  <View
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.resultIconBadge,
                        {
                          backgroundColor: scanResult.success
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={scanResult.success ? 'checkmark-circle' : 'alert-circle'}
                        size={40}
                        color={scanResult.success ? '#22C55E' : '#EF4444'}
                      />
                    </View>
                    <Text style={[styles.resultTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {scanResult.title}
                    </Text>
                    <Text style={[styles.resultMessage, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {scanResult.message}
                    </Text>

                    <View style={styles.resultBtnRow}>
                      {scanResult.success ? (
                        <TouchableOpacity
                          style={[styles.resultBtn, { backgroundColor: palette.primary }]}
                          onPress={onClose}
                        >
                          <Text style={styles.resultBtnText}>Tamam</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.resultBtn, { backgroundColor: palette.border }]}
                            onPress={onClose}
                          >
                            <Text style={[styles.resultBtnText, { color: palette.text }]}>Kapat</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.resultBtn, { backgroundColor: palette.primary }]}
                            onPress={handleResetScan}
                          >
                            <Text style={styles.resultBtnText}>Tekrar Tara</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.instructionBox}>
                    <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.instructionText}>
                      Masa üzerindeki QR kodu çerçeve içine hizalayın
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  permissionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 16,
    padding: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 40,
  },
  topHeaderBar: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchActiveBtn: {
    backgroundColor: '#2C98F6',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  studentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  studentChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scanBoxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#2C98F6',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  laserLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#2C98F6',
    borderRadius: 2,
    shadowColor: '#2C98F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  processingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  processingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomArea: {
    width: '100%',
    paddingHorizontal: 24,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  resultCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  resultIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
