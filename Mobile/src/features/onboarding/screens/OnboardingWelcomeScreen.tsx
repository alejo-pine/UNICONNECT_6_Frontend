import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  imageUri: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'study-groups',
    title: 'Encontrar grupos de estudio',
    description: 'Encuentra grupos de estudio de tus materias favoritas de tu profesión y conecta con otros estudiantes que comparten tus intereses academicos.',
    imageUri: 'https://bw.grupoaspasia.com/wp-content/uploads/2024/10/estudiar-en-grupo-examenes.jpg',
  },
  {
    id: 'shared-material',
    title: 'Unirse y compartir material',
    description: 'Accede a recursos compartidos por tus compañeros de grupo, y comparte tus propios apuntes y guías de estudio',
    imageUri: 'https://i.pinimg.com/1200x/9b/c9/b8/9bc9b8466c0f2de9989075c67fcec8f0.jpg',
  },
  {
    id: 'chat',
    title: 'Chatear',
    description: 'Comunicate con tus compañeros de estudio en tiempo real, organiza sesiones de estudio y resuelve dudas al instante a través de nuestro chat integrado.',
    imageUri: 'https://i.pinimg.com/1200x/85/06/6b/85066b15cf2635799a39c035f06e0227.jpg',
  },
  {
    id: 'events',
    title: 'Eventos UCaldas',
    description:
      'Mantente al tanto de todos los eventos academicos y culturales de nuestra universidad. No te pierdas ni un solo momento de la vida universitaria.',
    imageUri: 'https://www.ucaldas.edu.co/portal/wp-content/uploads/2024/10/u-caldas.jpg',
  },
];

const COLORS = {
  background: '#F3F5F7',
  navy: '#062E57',
  text: '#4C5E76',
  skip: '#7A8EA8',
  dotInactive: '#D4DBE5',
  dotActive: '#C8A04D',
  accent: '#032D5A',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function OnboardingWelcomeScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [step, setStep] = useState(0);

  const isLastStep = step === SLIDES.length - 1;
  const horizontalPadding = useMemo(() => clamp(screenWidth * 0.055, 18, 24), [screenWidth]);
  const slideWidth = useMemo(() => screenWidth - horizontalPadding * 2, [horizontalPadding, screenWidth]);
  const isCompactDevice = useMemo(() => screenHeight < 740 || screenWidth < 370, [screenHeight, screenWidth]);
  const imageAspectRatio = 4 / 3;
  const imageHeight = useMemo(
    () => clamp(slideWidth / imageAspectRatio, isCompactDevice ? 210 : 240, 340),
    [imageAspectRatio, isCompactDevice, slideWidth]
  );
  const titleFontSize = useMemo(() => clamp(screenWidth * 0.082, 26, 36), [screenWidth]);
  const titleLineHeight = useMemo(() => Math.round(titleFontSize * 1.12), [titleFontSize]);
  const descriptionFontSize = useMemo(() => clamp(screenWidth * 0.042, 14, 17), [screenWidth]);
  const descriptionLineHeight = useMemo(() => Math.round(descriptionFontSize * 1.5), [descriptionFontSize]);

  const handleSkip = () => {
    router.replace('/(onboarding)/complete-profile');
  };

  const handleFinish = () => {
    router.replace('/(onboarding)/complete-profile');
  };

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const nextStep = Math.round(x / slideWidth);
      const boundedStep = Math.max(0, Math.min(nextStep, SLIDES.length - 1));
      setStep(boundedStep);
    },
    [slideWidth]
  );

  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlide }) => {
      return (
        <View style={[styles.slide, { width: slideWidth }]}>
          <View style={[styles.imageFrame, { height: imageHeight }]}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.textBlock}>
            <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}>
              {item.title}
            </Text>
            <Text style={[styles.description, { fontSize: descriptionFontSize, lineHeight: descriptionLineHeight }]}>
              {item.description}
            </Text>
          </View>
        </View>
      );
    },
    [descriptionFontSize, descriptionLineHeight, imageHeight, slideWidth, titleFontSize, titleLineHeight]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
        <View style={styles.headerRow}>
          <Text allowFontScaling={false} style={styles.brand}>
            UniConnect
          </Text>
          {!isLastStep ? (
            <Pressable onPress={handleSkip}>
              <Text allowFontScaling={false} style={styles.skipText}>
                Saltar
              </Text>
            </Pressable>
          ) : (
            <View style={styles.skipSpacer} />
          )}
        </View>

        <View style={styles.carouselArea}>
          <FlatList
            data={SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={handleMomentumEnd}
            renderItem={renderItem}
            contentContainerStyle={styles.sliderContent}
            decelerationRate="fast"
            snapToInterval={slideWidth}
            snapToAlignment="start"
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            style={styles.sliderList}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, index) => (
              <View key={slide.id} style={[styles.dot, index === step ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>

          {isLastStep ? (
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.finishButton,
                pressed && styles.finishButtonPressed,
              ]}
            >
              <Text allowFontScaling={false} style={styles.finishButtonText}>
                Comenzar Configuracion
              </Text>
            </Pressable>
          ) : (
            <Text allowFontScaling={false} style={styles.swipeHint}>
              Desliza para continuar
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingBottom: 10,
  },
  headerRow: {
    marginTop: 16,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: '700',
  },
  skipText: {
    color: COLORS.skip,
    fontSize: 16,
    fontWeight: '500',
  },
  skipSpacer: {
    width: 60,
  },
  carouselArea: {
    flex: 1,
  },
  sliderList: {
    flex: 1,
  },
  sliderContent: {
    alignItems: 'stretch',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFrame: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5EAF0',
  },
  textBlock: {
    marginTop: 22,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  title: {
    color: COLORS.navy,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: COLORS.text,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotInactive: {
    backgroundColor: COLORS.dotInactive,
  },
  dotActive: {
    backgroundColor: COLORS.dotActive,
  },
  swipeHint: {
    color: '#6B7E95',
    fontSize: 14,
    fontWeight: '500',
  },
  finishButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: '#032D5A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 6,
  },
  finishButtonPressed: {
    opacity: 0.82,
  },
  finishButtonText: {
    color: '#D7A548',
    fontSize: 16,
    fontWeight: '700',
  },
});
