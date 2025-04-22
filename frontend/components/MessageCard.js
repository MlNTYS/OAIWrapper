import { Box, Text, createStyles, Divider } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';
import React from 'react';

// 동적 import로 ESM-only 하이라이터를 클라이언트에서만 로드
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Prism),
  { ssr: false }
);

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

// 수식(LaTeX) 인라인/블록 치환 함수
function renderWithMath(text) {
  // $$...$$ 블록 수식 먼저 치환
  const blockRegex = /\$\$(.+?)\$\$/gs;
  // $...$ 인라인 수식 치환 (블록 제외)
  const inlineRegex = /\$(.+?)\$/g;
  // 블록 수식 치환
  let elements = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = blockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    elements.push(<BlockMath key={key++}>{match[1]}</BlockMath>);
    lastIndex = blockRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  // 인라인 수식 치환 (블록 수식 치환 후 남은 텍스트에만 적용)
  elements = elements.flatMap((el) => {
    if (typeof el !== 'string') return el;
    const parts = [];
    let last = 0;
    let m;
    while ((m = inlineRegex.exec(el)) !== null) {
      if (m.index > last) parts.push(el.slice(last, m.index));
      parts.push(<InlineMath key={key++}>{m[1]}</InlineMath>);
      last = inlineRegex.lastIndex;
    }
    if (last < el.length) parts.push(el.slice(last));
    return parts;
  });
  return elements;
}

export default function MessageCard({ content, isUser }) {
  const { classes } = useStyles({ isUser });
  // 클라이언트에서만 oneDark 스타일 사용
  const oneDark = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    // eslint-disable-next-line global-require
    return require('react-syntax-highlighter/dist/esm/styles/prism').oneDark;
  }, []);
  return (
    <Box className={classes.card}>
      {isUser ? (
        <Text size="md">{content}</Text>
      ) : (
        <ReactMarkdown
          components={{
            p: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Text size="md" mb="xs" {...props}>{renderWithMath(text)}</Text>;
            },
            strong: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Text component="strong" sx={{ fontWeight: 700 }} {...props}>{text}</Text>;
            },
            h1: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Text size="lg" fw={700} mt="md" mb="xs" {...props}>{renderWithMath(text)}</Text>;
            },
            h2: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Text size="md" fw={600} mt="md" mb="xs" {...props}>{renderWithMath(text)}</Text>;
            },
            h3: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Text size="sm" fw={500} mt="md" mb="xs" {...props}>{renderWithMath(text)}</Text>;
            },
            ul: ({ node, ...props }) => <Box component="ul" px="md" mb="xs" {...props} />, 
            li: ({ node, children, ...props }) => {
              let text = '';
              if (typeof children === 'string') text = children;
              else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : (c?.props?.children ? (typeof c.props.children === 'string' ? c.props.children : Array.isArray(c.props.children) ? c.props.children.join('') : String(c.props.children)) : String(c))).join('');
              else text = String(children);
              return <Box component="li" ml="sm" mb="xs" {...props}>{renderWithMath(text)}</Box>;
            },
            hr: () => <Divider my="sm" color="dark.5" />, 
            blockquote: ({ node, ...props }) => <Text italic color="dimmed" mb="xs" {...props} />, 
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              // 클라이언트에서만 하이라이트, 서버에서는 <pre><code>
              if (typeof window === 'undefined') {
                return !inline ? (
                  <pre style={{ background: '#23272e', borderRadius: 8, padding: '0.8em 1em', fontSize: 14, color: '#e6e6e6', margin: 0 }}>
                    <code>{String(children).replace(/\n$/, '')}</code>
                  </pre>
                ) : (
                  <code style={{ background: '#23272e', color: '#e6e6e6', borderRadius: 4, padding: '0.1em 0.4em', fontSize: 14 }}>{children}</code>
                );
              }
              return !inline ? (
                <Box my="sm">
                  <SyntaxHighlighter
                    style={oneDark || {}}
                    language={match ? match[1] : 'plaintext'}
                    PreTag="div"
                    customStyle={{
                      borderRadius: 8,
                      fontSize: 14,
                      padding: '0.8em 1em',
                      background: '#23272e',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {Array.isArray(children) ? children.join('') : String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </Box>
              ) : (
                <Text
                  component="code"
                  sx={{
                    background: '#23272e',
                    color: '#e6e6e6',
                    borderRadius: 4,
                    padding: '0.1em 0.4em',
                    fontSize: 14,
                  }}
                  {...props}
                >
                  {typeof children === 'string' ? children : String(children)}
                </Text>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </Box>
  );
} 