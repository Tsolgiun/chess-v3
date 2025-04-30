import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../types';

const Container = styled(motion.div)<{ theme: { colors: ThemeColors } }>`
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 20px;
  background: ${({ theme }) => theme.colors.primary};
  transition: background-color 0.3s ease;
  min-height: calc(100vh - 80px);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1<{ theme: { colors: ThemeColors } }>`
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p<{ theme: { colors: ThemeColors } }>`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.8;
  max-width: 800px;
  margin: 0 auto;
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BlogCard = styled(motion.div)<{ theme: { colors: ThemeColors } }>`
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`;

interface BlogImageProps {
  src: string;
}

const BlogImage = styled.div<BlogImageProps>`
  height: 200px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
`;

const BlogContent = styled.div`
  padding: 20px;
`;

const BlogTitle = styled.h2<{ theme: { colors: ThemeColors } }>`
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.text};
`;

const BlogMeta = styled.div<{ theme: { colors: ThemeColors } }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
`;

const BlogExcerpt = styled.p<{ theme: { colors: ThemeColors } }>`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
  line-height: 1.6;
`;

const ReadMoreLink = styled(Link)<{ theme: { colors: ThemeColors } }>`
  display: inline-block;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s ease, transform 0.3s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
`;

const Tag = styled.span<{ theme: { colors: ThemeColors } }>`
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.highlight};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
}

// Sample blog posts data
const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "How to Play Chess: A Beginner's Guide",
    excerpt: "Learn the basic rules, piece movements, and strategies to get started with chess. This comprehensive guide will take you from complete beginner to confident player.",
    date: "April 15, 2025",
    author: "Magnus Anderson",
    image: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["beginner", "tutorial", "basics"]
  },
  {
    id: 2,
    title: "Understanding Chess Openings: The Sicilian Defense",
    excerpt: "Explore one of the most popular and aggressive responses to White's 1.e4. Learn the key variations and strategic ideas behind the Sicilian Defense.",
    date: "April 10, 2025",
    author: "Garry Kasparov",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["openings", "strategy", "intermediate"]
  },
  {
    id: 3,
    title: "Latest Chess News: Carlsen Wins Tata Steel 2025",
    excerpt: "World Champion Magnus Carlsen has won the prestigious Tata Steel Chess Tournament for the 10th time, finishing with an impressive 9.5/13 score.",
    date: "April 5, 2025",
    author: "Susan Polgar",
    image: "https://images.unsplash.com/photo-1580541832626-2a7131ee809f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["news", "tournaments", "grandmasters"]
  },
  {
    id: 4,
    title: "Chess Tactics: Mastering the Fork",
    excerpt: "Improve your tactical vision by learning how to execute devastating forks. This article covers knight forks, pawn forks, and more complex tactical patterns.",
    date: "March 28, 2025",
    author: "Judit Polgar",
    image: "https://images.unsplash.com/photo-1560174038-594a6e2e8b28?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["tactics", "intermediate", "training"]
  }
];

const Blog: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <Container
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <Header>
        <Title>Chess Blog</Title>
        <Description>
          Explore articles, tutorials, and the latest news from the world of chess. 
          Whether you're a beginner or an experienced player, there's something here for everyone.
        </Description>
      </Header>

      <BlogGrid>
        {blogPosts.map((post, index) => (
          <BlogCard
            key={post.id}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            <BlogImage src={post.image} />
            <BlogContent>
              <BlogTitle>{post.title}</BlogTitle>
              <BlogMeta>
                <span>{post.date}</span>
                <span>By {post.author}</span>
              </BlogMeta>
              <TagsContainer>
                {post.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagsContainer>
              <BlogExcerpt>{post.excerpt}</BlogExcerpt>
              <ReadMoreLink to={`/blog/${post.id}`}>Read More</ReadMoreLink>
            </BlogContent>
          </BlogCard>
        ))}
      </BlogGrid>
    </Container>
  );
};

export default Blog;
