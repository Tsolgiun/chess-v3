import React from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import { ThemeColors } from '../types';

// Create wrapper components for the icons
const ArrowLeftIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaArrowLeft({})}</div>
);
const CalendarAltIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaCalendarAlt({})}</div>
);
const UserIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaUser({})}</div>
);
const TagIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaTag({})}</div>
);

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  content: string;
}

// Sample blog posts data (same as in Blog.tsx)
const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "How to Play Chess: A Beginner's Guide",
    excerpt: "Learn the basic rules, piece movements, and strategies to get started with chess. This comprehensive guide will take you from complete beginner to confident player.",
    date: "April 15, 2025",
    author: "Magnus Anderson",
    image: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["beginner", "tutorial", "basics"],
    content: `
      <h2>Getting Started with Chess</h2>
      <p>Chess is a two-player strategy board game played on a checkered board with 64 squares arranged in an 8×8 grid. Each player begins with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns.</p>
      
      <h3>The Chess Board</h3>
      <p>The chessboard is set up with the white square in the bottom right corner. The rows (called ranks) are numbered 1-8, starting from the white side. The columns (called files) are labeled a-h, from left to right from White's perspective.</p>
      
      <h3>The Chess Pieces</h3>
      <p>Each chess piece moves in a specific way:</p>
      <ul>
        <li><strong>King:</strong> Moves one square in any direction.</li>
        <li><strong>Queen:</strong> Moves any number of squares diagonally, horizontally, or vertically.</li>
        <li><strong>Rook:</strong> Moves any number of squares horizontally or vertically.</li>
        <li><strong>Bishop:</strong> Moves any number of squares diagonally.</li>
        <li><strong>Knight:</strong> Moves in an L-shape: two squares horizontally or vertically and then one square perpendicular to that direction.</li>
        <li><strong>Pawn:</strong> Moves forward one square, but captures diagonally. On its first move, a pawn can move two squares forward.</li>
      </ul>
      
      <h3>Special Rules</h3>
      <p>Chess has several special rules:</p>
      <ul>
        <li><strong>Castling:</strong> A defensive move where the king moves two squares toward a rook, and the rook moves to the square the king crossed.</li>
        <li><strong>En Passant:</strong> If a pawn moves two squares forward from its starting position and lands beside an opponent's pawn, the opponent's pawn can capture it as if it had moved only one square.</li>
        <li><strong>Promotion:</strong> When a pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a queen).</li>
      </ul>
      
      <h3>Basic Strategy</h3>
      <p>Here are some basic strategic principles for beginners:</p>
      <ul>
        <li>Control the center of the board</li>
        <li>Develop your pieces early</li>
        <li>Castle to protect your king</li>
        <li>Connect your rooks</li>
        <li>Don't bring your queen out too early</li>
        <li>Think about pawn structure</li>
      </ul>
      
      <h3>Common Openings for Beginners</h3>
      <p>Some good openings for beginners include:</p>
      <ul>
        <li>Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4)</li>
        <li>Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5)</li>
        <li>Queen's Gambit (1.d4 d5 2.c4)</li>
        <li>London System (1.d4 followed by 2.Bf4)</li>
      </ul>
      
      <h3>Practice Makes Perfect</h3>
      <p>The best way to improve at chess is to play regularly, analyze your games, and study basic tactics and strategies. Online platforms like chess.com, lichess.org, and chess24.com offer opportunities to play against players of all levels and access learning resources.</p>
    `
  },
  {
    id: 2,
    title: "Understanding Chess Openings: The Sicilian Defense",
    excerpt: "Explore one of the most popular and aggressive responses to White's 1.e4. Learn the key variations and strategic ideas behind the Sicilian Defense.",
    date: "April 10, 2025",
    author: "Garry Kasparov",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["openings", "strategy", "intermediate"],
    content: `
      <h2>The Sicilian Defense: An Aggressive Counter to 1.e4</h2>
      <p>The Sicilian Defense, beginning with 1.e4 c5, is Black's most popular response to White's king pawn opening. It immediately creates an asymmetrical position and fights for the center, setting the stage for a complex and dynamic game.</p>
      
      <h3>Why Play the Sicilian?</h3>
      <p>The Sicilian is a fighting opening that gives Black excellent winning chances. While White scores well in many 1.e4 openings, the Sicilian has historically given Black the best statistical chances. It's an excellent choice for players who want to play for a win with the black pieces.</p>
      
      <h3>Main Variations</h3>
      <p>There are several major variations of the Sicilian Defense:</p>
      
      <h4>The Najdorf Variation (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6)</h4>
      <p>Named after Miguel Najdorf, this is one of the most popular and theoretically developed variations. Black prepares ...e5 and develops pieces flexibly. The Najdorf can lead to extremely sharp positions with attacking chances for both sides.</p>
      
      <h4>The Dragon Variation (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6)</h4>
      <p>Black fianchettoes the bishop on g7, aiming it at White's queenside. This creates a powerful diagonal and often leads to opposite-side castling and mutual attacks. The Dragon is known for its aggressive nature and tactical complexity.</p>
      
      <h4>The Classical Variation (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 Nc6)</h4>
      <p>Black develops naturally and maintains flexibility. This solid approach can transpose into other variations depending on White's play.</p>
      
      <h4>The Scheveningen Variation (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6)</h4>
      <p>Black creates a solid pawn structure with ...e6 and often follows with ...a6 and ...Be7. This flexible setup can transpose to the Najdorf or other variations.</p>
      
      <h3>Key Strategic Ideas</h3>
      <p>Despite the many variations, some common strategic themes in the Sicilian include:</p>
      <ul>
        <li>Black often accepts a backward d-pawn in exchange for active piece play</li>
        <li>The asymmetrical pawn structure leads to imbalanced positions</li>
        <li>Black frequently plays on the queenside while White attacks on the kingside</li>
        <li>Control of the d5 square is often crucial</li>
        <li>Timing of central pawn breaks (like ...d5 or ...e5) is critical</li>
      </ul>
      
      <h3>Famous Sicilian Games</h3>
      <p>Some of the most brilliant chess games have been played in Sicilian Defense variations. Notable examples include Kasparov vs. Topalov (Wijk aan Zee 1999) and Fischer vs. Spassky (World Championship 1972, Game 6).</p>
      
      <h3>Conclusion</h3>
      <p>The Sicilian Defense remains one of the most dynamic and rewarding openings in chess. While it requires significant study to master, it offers rich strategic and tactical possibilities for players at all levels who are willing to embrace complex positions.</p>
    `
  },
  {
    id: 3,
    title: "Latest Chess News: Carlsen Wins Tata Steel 2025",
    excerpt: "World Champion Magnus Carlsen has won the prestigious Tata Steel Chess Tournament for the 10th time, finishing with an impressive 9.5/13 score.",
    date: "April 5, 2025",
    author: "Susan Polgar",
    image: "https://images.unsplash.com/photo-1580541832626-2a7131ee809f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["news", "tournaments", "grandmasters"],
    content: `
      <h2>Carlsen Dominates at Tata Steel Chess 2025</h2>
      <p>World Chess Champion Magnus Carlsen has secured his 10th victory at the prestigious Tata Steel Chess Tournament in Wijk aan Zee, Netherlands, finishing with an impressive score of 9.5/13.</p>
      
      <h3>Tournament Highlights</h3>
      <p>The 87th edition of the Tata Steel Chess Tournament featured 14 of the world's top players competing in a round-robin format. Carlsen finished 1.5 points ahead of his nearest rival, demonstrating his continued dominance in elite chess events.</p>
      
      <p>Key moments from the tournament included:</p>
      <ul>
        <li>Carlsen's brilliant win against Firouzja in round 7, featuring a stunning queen sacrifice</li>
        <li>A crucial victory against Chinese prodigy Wei Yi in the penultimate round</li>
        <li>An undefeated performance with 6 wins and 7 draws</li>
      </ul>
      
      <h3>Final Standings</h3>
      <p>The final standings of the tournament were:</p>
      <ol>
        <li>Magnus Carlsen (Norway) - 9.5/13</li>
        <li>Alireza Firouzja (France) - 8/13</li>
        <li>Fabiano Caruana (USA) - 7.5/13</li>
        <li>Ding Liren (China) - 7.5/13</li>
        <li>Wei Yi (China) - 7/13</li>
      </ol>
      
      <h3>Carlsen's Reaction</h3>
      <p>"I'm very pleased with my performance here," Carlsen said in the post-tournament interview. "Wijk aan Zee has always been special to me, and winning for the 10th time is a milestone I'm proud of. The quality of play was extremely high this year, which makes this victory even more satisfying."</p>
      
      <h3>Rating Implications</h3>
      <p>With this performance, Carlsen has increased his live rating to 2864, approaching his own record of 2882. He continues to maintain a substantial lead over his competitors in the world rankings.</p>
      
      <h3>Next Major Events</h3>
      <p>The chess calendar continues with several major events in the coming months:</p>
      <ul>
        <li>The Candidates Tournament in April, which will determine Carlsen's next World Championship challenger</li>
        <li>Norway Chess in May, where Carlsen will play on home soil</li>
        <li>The Grand Chess Tour, beginning in June</li>
      </ul>
      
      <h3>Historical Context</h3>
      <p>Carlsen's 10th Tata Steel victory extends his record at the tournament, surpassing the previous record of 7 wins held by Viswanathan Anand. The tournament, formerly known as the Hoogovens tournament, has been running since 1938 and is considered one of the most prestigious events in the chess calendar.</p>
    `
  },
  {
    id: 4,
    title: "Chess Tactics: Mastering the Fork",
    excerpt: "Improve your tactical vision by learning how to execute devastating forks. This article covers knight forks, pawn forks, and more complex tactical patterns.",
    date: "March 28, 2025",
    author: "Judit Polgar",
    image: "https://images.unsplash.com/photo-1560174038-594a6e2e8b28?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    tags: ["tactics", "intermediate", "training"],
    content: `
      <h2>Understanding the Fork in Chess</h2>
      <p>A fork is one of the most fundamental tactical motifs in chess. It occurs when a single piece attacks two or more enemy pieces simultaneously. The opponent can typically only save one of the threatened pieces, resulting in material gain.</p>
      
      <h3>Types of Forks</h3>
      
      <h4>Knight Forks</h4>
      <p>Knights are especially effective at delivering forks due to their unique L-shaped movement. A well-placed knight can attack multiple pieces from a safe position. The "royal fork" occurs when a knight simultaneously checks the king and attacks the queen, virtually guaranteeing the win of the queen.</p>
      
      <p>Example position: White knight on d5 forking Black's king on e7 and queen on c7.</p>
      
      <h4>Pawn Forks</h4>
      <p>Pawn forks occur when a pawn attacks two pieces diagonally. These are particularly effective because pawns are the least valuable pieces, making the exchange highly favorable.</p>
      
      <p>Example position: White pawn on e5 forking Black's bishop on d6 and knight on f6.</p>
      
      <h4>Queen Forks</h4>
      <p>Due to the queen's mobility, it can deliver powerful forks. However, since the queen is the most valuable piece, these forks are only advantageous when attacking undefended pieces or when one of the attacked pieces is the king (check).</p>
      
      <h4>Other Piece Forks</h4>
      <p>Kings, rooks, and bishops can also create forks, though less commonly than knights and pawns.</p>
      
      <h3>Setting Up Forks</h3>
      <p>Creating fork opportunities often requires preparation:</p>
      <ul>
        <li><strong>Decoys:</strong> Forcing an enemy piece to a vulnerable square</li>
        <li><strong>Discovered Attacks:</strong> Moving one piece to reveal an attack by another</li>
        <li><strong>Zwischenzug:</strong> An intermediate move that changes the tactical situation</li>
        <li><strong>Clearance:</strong> Removing a piece that blocks a potential fork</li>
      </ul>
      
      <h3>Defending Against Forks</h3>
      <p>To avoid being forked, consider these defensive principles:</p>
      <ul>
        <li>Keep valuable pieces on squares of opposite colors from enemy knights</li>
        <li>Be aware of potential knight outposts near your key pieces</li>
        <li>Maintain proper spacing between important pieces</li>
        <li>Consider prophylactic moves that prevent forks</li>
        <li>When forked, look for counterattacks or defensive resources</li>
      </ul>
      
      <h3>Training Your Fork Vision</h3>
      <p>Improving your ability to spot fork opportunities requires practice:</p>
      <ul>
        <li>Solve tactical puzzles focusing on forks</li>
        <li>Analyze your games to identify missed fork opportunities</li>
        <li>Study master games with notable fork examples</li>
        <li>Practice visualization by setting up positions and finding forks</li>
      </ul>
      
      <h3>Famous Fork Examples</h3>
      <p>One of the most famous fork examples occurred in the game Karpov vs. Kasparov (World Championship 1985), where Kasparov executed a brilliant knight fork that contributed to his eventual world championship title.</p>
      
      <h3>Conclusion</h3>
      <p>Mastering the fork will significantly improve your tactical prowess. By recognizing fork patterns and creating opportunities for them in your games, you'll win material more frequently and increase your overall chess strength.</p>
    `
  }
];

const Container = styled(motion.div)<{ theme: { colors: ThemeColors } }>`
  max-width: 900px;
  margin: 80px auto 0;
  padding: 20px;
  background: ${({ theme }) => theme.colors.primary};
  transition: background-color 0.3s ease;
  min-height: calc(100vh - 80px);
  
  @media (max-width: 768px) {
    padding-bottom: 90px; /* Add padding for the bottom navigation bar */
  }
`;

const BackLink = styled(Link)<{ theme: { colors: ThemeColors } }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-5px);
  }
`;

const BlogHeader = styled.div`
  margin-bottom: 30px;
`;

interface BlogImageProps {
  src: string;
}

const BlogImage = styled.div<BlogImageProps>`
  height: 400px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  margin-bottom: 30px;
`;

const Title = styled.h1<{ theme: { colors: ThemeColors } }>`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const MetaInfo = styled.div<{ theme: { colors: ThemeColors } }>`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.8;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
`;

const Tag = styled.span<{ theme: { colors: ThemeColors } }>`
  padding: 5px 12px;
  background: ${({ theme }) => theme.colors.highlight};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Content = styled.div<{ theme: { colors: ThemeColors } }>`
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.8;
  font-size: 1.1rem;
  
  h2, h3, h4 {
    margin-top: 30px;
    margin-bottom: 15px;
  }
  
  p {
    margin-bottom: 20px;
  }
  
  ul, ol {
    margin-bottom: 20px;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 10px;
  }
  
  strong {
    font-weight: 600;
  }
`;

const NotFound = styled.div`
  text-align: center;
  padding: 50px;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.text};
  }
  
  p {
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 30px;
  }
`;

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find(post => post.id === parseInt(id || '0'));
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (!post) {
    return (
      <Container
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <BackLink to="/blog">
          <ArrowLeftIcon /> Back to Blog
        </BackLink>
        <NotFound>
          <h2>Blog Post Not Found</h2>
          <p>The blog post you're looking for doesn't exist or has been removed.</p>
          <BackLink to="/blog">
            <ArrowLeftIcon /> Return to Blog
          </BackLink>
        </NotFound>
      </Container>
    );
  }

  return (
    <Container
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <BackLink to="/blog">
        <ArrowLeftIcon /> Back to Blog
      </BackLink>
      
      <BlogHeader>
        <Title>{post.title}</Title>
        <MetaInfo>
          <MetaItem>
            <CalendarAltIcon />
            {post.date}
          </MetaItem>
          <MetaItem>
            <UserIcon />
            By {post.author}
          </MetaItem>
        </MetaInfo>
        <TagsContainer>
          {post.tags.map(tag => (
            <Tag key={tag}>
              <TagIcon />
              {tag}
            </Tag>
          ))}
        </TagsContainer>
      </BlogHeader>
      
      <BlogImage src={post.image} />
      
      <Content dangerouslySetInnerHTML={{ __html: post.content }} />
    </Container>
  );
};

export default BlogPost;
