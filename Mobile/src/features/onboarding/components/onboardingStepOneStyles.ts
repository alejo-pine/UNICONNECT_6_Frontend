import { StyleSheet } from 'react-native';

const COLORS = {
  background: '#F2F2F2',
  header: '#00284D',
  white: '#FFFFFF',
  text: '#25344A',
  muted: '#7E8DA3',
  border: '#D5DDE8',
  gold: '#C8A04D',
  error: '#C13F3F',
  surface: '#F8FAFC',
};

export const onboardingStepOneStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 110,
    backgroundColor: COLORS.header,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  stepText: {
    fontSize: 13,
    color: '#8B9BB3',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: COLORS.gold,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  subtitle: {
    marginTop: 30,
    fontSize: 34,
    lineHeight: 40,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  helperText: {
    marginTop: 22,
    fontSize: 20,
    lineHeight: 30,
    color: '#3C4A5F',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  formContainer: {
    marginTop: 44,
    gap: 20,
  },
  fieldContainer: {
    position: 'relative',
  },
  fieldBox: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  fieldBoxActive: {
    borderColor: COLORS.gold,
  },
  input: {
    flex: 1,
    color: '#1F2A3C',
    fontSize: 18,
    paddingVertical: 10,
  },
  selectText: {
    flex: 1,
    color: '#1F2A3C',
    fontSize: 18,
  },
  placeholderText: {
    color: '#6B798F',
  },
  listContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    maxHeight: 220,
    overflow: 'hidden',
  },
  listItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF2F7',
  },
  listItemText: {
    color: '#293447',
    fontSize: 16,
  },
  listEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#7E8DA3',
    fontSize: 15,
  },
  fieldError: {
    marginTop: 8,
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 4,
  },
  globalError: {
    marginTop: 4,
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  continueButton: {
    marginTop: 28,
    marginBottom: 24,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.header,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
