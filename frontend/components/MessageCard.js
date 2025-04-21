import { Box, Text, createStyles, Divider } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

const useStyles = createStyles((theme, { isUser }) => ({
  card: {
    background: isUser ? theme.colors.dark[6] : theme.colors.dark[4],
    color: isUser ? theme.colors.blue[3] : theme.white,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    marginBottom: theme.spacing.xs,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    maxWidth: '80%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: theme.fontSizes.sm,
    boxShadow: 'none',
  },
}));

export default function MessageCard({ content, isUser }) {
  const { classes } = useStyles({ isUser });
  return (
    <Box className={classes.card}>
      {isUser ? (
        <Text size="md">{content}</Text>
      ) : (
        <ReactMarkdown
          components={{
            // 문단
            p: ({ node, ...props }) => <Text size="md" mb="xs" {...props} />,
            // 강조
            strong: ({ node, ...props }) => <Text component="strong" {...props} sx={{ fontWeight: 700 }} />,
            // 제목
            h1: ({ node, ...props }) => <Text size="lg" fw={700} mt="md" mb="xs" {...props} />,
            h2: ({ node, ...props }) => <Text size="md" fw={600} mt="md" mb="xs" {...props} />,
            h3: ({ node, ...props }) => <Text size="sm" fw={500} mt="md" mb="xs" {...props} />,
            // 목록
            ul: ({ node, ...props }) => <Box component="ul" px="md" mb="xs" {...props} />,
            li: ({ node, ...props }) => <Box component="li" ml="sm" mb="xs" {...props} />,
            // 구분선
            hr: () => <Divider my="sm" color="dark.5" />,
            // 인용구
            blockquote: ({ node, ...props }) => <Text italic color="dimmed" mb="xs" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </Box>
  );
} 