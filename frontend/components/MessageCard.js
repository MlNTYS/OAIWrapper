import { Box, Text, createStyles, Divider, useMantineTheme } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

const useStyles = createStyles((theme, { isUser }) => ({
  markdown: {
    width: '100%',
    display: 'inline',
    '& .math': {
      overflow: 'auto',
      display: 'block',
      width: '100%',
    },
    '& .katex-display': {
      overflow: 'auto hidden',
      margin: '1em 0',
      padding: '0.5em 0',
      display: 'flex !important',
      justifyContent: 'center !important',
    },
    '& .katex': {
      fontSize: '1.3em !important',
      fontFamily: '"KaTeX_Math", "Times New Roman", serif !important',
    },
    '& .katex-html': {
      display: 'flex !important',
      justifyContent: 'center !important',
    },
    '& .math-inline': {
      padding: '0 4px',
    },
    '& .math-block': {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      margin: '1em 0',
    },
    '& .fraction': {
      display: 'inline-block !important',
    },
    '& p': {
      display: 'inline',
      margin: 0,
      padding: 0,
    }
  },
  mathBlock: {
    margin: '1em 0',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    overflowX: 'auto',
  },
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
  textContainer: {
    display: 'inline',
  },
  inlineMath: {
    display: 'inline-flex',
    alignItems: 'center',
    margin: '0 2px',
    verticalAlign: 'middle',
  },
  inlineContentWrapper: {
    display: 'inline',
  }
}));

// 리스트 항목 패턴 찾기
const isListItem = (text) => {
  return /^\s*[-*+]\s/.test(text);
};

// 수식과 코드 블록을 찾는 정규식
const extractMathAndCode = (content) => {
  // 결과 배열
  const segments = [];
  let currentIndex = 0;
  
  // 모든 수식 (블록 및 인라인) 찾기
  const mathPattern = /\$\$(.*?)\$\$|\$([^\$\n]+?)\$/gs;
  let match;
  
  while ((match = mathPattern.exec(content)) !== null) {
    // 이전 일반 텍스트 추가
    if (match.index > currentIndex) {
      segments.push({
        type: 'text',
        content: content.substring(currentIndex, match.index)
      });
    }
    
    // 블록 수식인 경우 ($$...$$)
    if (match[1] !== undefined) {
      segments.push({
        type: 'blockMath',
        content: match[1].trim()
      });
    } 
    // 인라인 수식인 경우 ($...$)
    else if (match[2] !== undefined) {
      segments.push({
        type: 'inlineMath',
        content: match[2].trim()
      });
    }
    
    currentIndex = match.index + match[0].length;
  }
  
  // 나머지 텍스트 추가
  if (currentIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(currentIndex)
    });
  }
  
  return segments;
};

export default function MessageCard({ content, isUser }) {
  const { classes } = useStyles({ isUser });
  const theme = useMantineTheme();
  
  // 사용자가 아닌 경우 수식과 일반 텍스트 분리
  const segments = isUser ? [{ type: 'text', content }] : extractMathAndCode(content);
  
  // 마크다운 컴포넌트 정의
  const markdownComponents = {
    // 문단
    p: ({ node, ...props }) => {
      const content = props.children?.toString() || '';
      // 목록 항목으로 시작하는 텍스트는 블록으로 표시
      if (isListItem(content)) {
        return <Text component="div" size="md" mb="xs" {...props} />;
      }
      return <Text component="span" size="md" sx={{ display: 'inline', lineHeight: 1.7 }} {...props} />;
    },
    // 강조
    strong: ({ node, ...props }) => <Text component="strong" {...props} sx={{ fontWeight: 700 }} />,
    // 제목
    h1: ({ node, ...props }) => <Text size="lg" fw={700} mt="md" mb="xs" {...props} />,
    h2: ({ node, ...props }) => <Text size="md" fw={600} mt="md" mb="xs" {...props} />,
    h3: ({ node, ...props }) => <Text size="sm" fw={500} mt="md" mb="xs" {...props} />,
    // 목록
    ul: ({ node, ...props }) => <Box component="ul" px="md" mb="xs" sx={{ display: 'block' }} {...props} />,
    li: ({ node, ...props }) => <Box component="li" ml="sm" mb="xs" sx={{ display: 'list-item' }} {...props} />,
    // 구분선
    hr: () => <Divider my="sm" color="dark.5" />,
    // 인용구
    blockquote: ({ node, ...props }) => <Text italic color="dimmed" mb="xs" {...props} />,
    // 코드 블록
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match && match[1] ? match[1] : '';
      const code = String(children).replace(/\n$/, '');
      
      // 코드 복사 함수
      const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
          console.log('Code copied to clipboard');
        });
      };
      
      return !inline ? (
        <Box
          sx={{
            position: 'relative',
            marginBottom: theme.spacing.xs,
            backgroundColor: theme.colors.dark[9],
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.dark[6]}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2px 8px',
            borderBottom: `1px solid ${theme.colors.dark[6]}`,
            backgroundColor: theme.colors.dark[8],
          }}>
            {language && (
              <Text size="xs" color="dimmed">
                {language}
              </Text>
            )}
            <Box 
              component="button"
              onClick={handleCopy}
              sx={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: theme.colors.gray[5],
                fontSize: theme.fontSizes.xs,
                padding: '2px 6px',
                borderRadius: theme.radius.sm,
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: theme.colors.dark[7],
                  color: theme.white,
                }
              }}
            >
              복사
            </Box>
          </Box>
          <Box
            component="pre"
            className={className}
            sx={{
              padding: theme.spacing.sm,
              margin: 0,
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: theme.fontSizes.sm,
            }}
            {...props}
          >
            <Box component="code" className={language ? `language-${language}` : ''}>
              {children}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          component="code"
          sx={{
            padding: '2px 4px',
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.dark[7],
            fontSize: theme.fontSizes.sm,
            fontFamily: 'monospace',
          }}
          {...props}
        >
          {children}
        </Box>
      );
    }
  };

  // 세그먼트 그룹화로 인라인 요소를 연속된 하나의 블록으로 처리
  const renderOptimizedSegments = (segments) => {
    // 블록 레벨 요소를 경계로 인라인 세그먼트들을 그룹화
    const result = [];
    let inlineGroup = [];

    const flushInlineGroup = () => {
      if (inlineGroup.length > 0) {
        result.push(
          <Text key={`inline-group-${result.length}`} component="div" sx={{ display: 'block' }}>
            {inlineGroup}
          </Text>
        );
        inlineGroup = [];
      }
    };

    segments.forEach((segment, index) => {
      if (segment.type === 'blockMath') {
        // 블록 요소 전에 인라인 그룹 처리
        flushInlineGroup();
        
        // 블록 수식 추가
        result.push(
          <Box key={`block-${index}`} className={classes.mathBlock}>
            <BlockMath math={segment.content} />
          </Box>
        );
      } else {
        // 인라인 요소 처리
        if (segment.type === 'inlineMath') {
          inlineGroup.push(
            <Box 
              key={`inline-${index}`} 
              component="span" 
              className={classes.inlineContentWrapper}
              sx={{ display: 'inline' }}
            >
              <InlineMath math={segment.content} />
            </Box>
          );
        } else {
          // 목록 항목 처리
          if (isListItem(segment.content)) {
            // 목록 항목은 새로운 블록으로 처리
            flushInlineGroup();
            result.push(
              <Box key={`list-${index}`} sx={{ display: 'block', width: '100%' }}>
                <ReactMarkdown
                  className={classes.markdown}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {segment.content}
                </ReactMarkdown>
              </Box>
            );
          } else {
            // 일반 텍스트는 인라인으로 처리
            inlineGroup.push(
              <Box 
                key={`text-${index}`} 
                component="span" 
                className={classes.inlineContentWrapper}
                sx={{ display: 'inline' }}
              >
                <ReactMarkdown
                  className={classes.markdown}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {segment.content}
                </ReactMarkdown>
              </Box>
            );
          }
        }
      }
    });

    // 남은 인라인 그룹 처리
    flushInlineGroup();

    return result;
  };

  return (
    <Box className={classes.card}>
      {isUser ? (
        <Text size="md">{content}</Text>
      ) : (
        <Box>
          {renderOptimizedSegments(segments)}
        </Box>
      )}
    </Box>
  );
}
