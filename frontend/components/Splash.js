import { Box, createStyles, Text, keyframes } from '@mantine/core';

const pulseAnimation = keyframes({
  '0%': { transform: 'scale(0.95)', opacity: 0.7 },
  '50%': { transform: 'scale(1.05)', opacity: 1 },
  '100%': { transform: 'scale(0.95)', opacity: 0.7 },
});

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

const useStyles = createStyles((theme) => ({
  splashContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, rgba(34, 35, 43, 0.9), rgba(20, 21, 26, 0.95))',
    position: 'relative',
    overflow: 'hidden',
    animation: `${fadeIn} 0.5s ease-in-out`,
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 15% 50%, rgba(88, 101, 242, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(101, 242, 155, 0.05), transparent 25%)',
      pointerEvents: 'none',
      zIndex: 0,
    }
  },
  
  logoContainer: {
    position: 'relative',
    zIndex: 1,
    animation: `${pulseAnimation} 2s infinite ease-in-out`,
    marginBottom: 30,
  },
  
  logo: {
    fontSize: 48,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #5E73FF 0%, #B175FF 100%)',
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `${shimmer} 2s infinite linear`,
    letterSpacing: '-1px',
  },
  
  subtitle: {
    color: theme.colors.gray[5],
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.sm,
    position: 'relative',
    zIndex: 1,
  },
  
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    position: 'relative',
    zIndex: 1,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.colors['royal-blue'][5],
    margin: '0 6px',
    
    '&:nth-of-type(1)': {
      animation: `${pulseAnimation} 1.4s infinite ease-in-out`,
    },
    
    '&:nth-of-type(2)': {
      animation: `${pulseAnimation} 1.4s 0.2s infinite ease-in-out`,
    },
    
    '&:nth-of-type(3)': {
      animation: `${pulseAnimation} 1.4s 0.4s infinite ease-in-out`,
    },
  },
}));

export function Splash() {
  const { classes } = useStyles();
  
  return (
    <Box className={classes.splashContainer}>
      <Box className={classes.logoContainer}>
        <Text className={classes.logo}>로딩중...</Text>
      </Box>
      
      <Text className={classes.subtitle}>
        잠시만 기다려주세요...
      </Text>
      
      <Box className={classes.loadingDots}>
        <Box className={classes.dot} />
        <Box className={classes.dot} />
        <Box className={classes.dot} />
      </Box>
    </Box>
  );
} 