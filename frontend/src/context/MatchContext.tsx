import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { profiles } from '../data/profiles';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

interface Match {
  id: string;
  userId: string;
  targetId: string;
    timestamp: string;
  mutual: boolean;
}

interface MatchContextType {
  matches: Match[];
  likeProfile: (profileId: number, callback?: (matchId: string) => void) => void;
  getMatchByProfileId: (profileId: number) => Match | undefined;
  checkMutualMatch: (profileId: number) => boolean;
  calculateCompatibility: (profileId: number) => number;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);

  // Load matches from local storage on mount
  useEffect(() => {
    if (user) {
      const storedMatches = localStorage.getItem(`matches_${user.id}`);
      if (storedMatches) {
        setMatches(JSON.parse(storedMatches));
      }
    }
  }, [user]);

  // Save matches to local storage when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`matches_${user.id}`, JSON.stringify(matches));
    }
  }, [matches, user]);

  // Like a profile
  const likeProfile = (profileId: number, callback?: (matchId: string) => void) => {
    if (!user) return;
    
    // Check if already liked
    const existingMatch = getMatchByProfileId(profileId);
    if (existingMatch) {
      if (callback) callback(existingMatch.id);
      return;
    }
    
    // Create a new match
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      userId: user.id,
      targetId: profileId.toString(),
      timestamp: new Date().toISOString(),
      mutual: false
    };
    
    // Check for mutual match
    const checkMutual = () => {
      // Check if the target has already liked the user
      const targetMatches = JSON.parse(localStorage.getItem(`matches_${profileId}`) || '[]');
      const isMutual = targetMatches.some((match: Match) => match.targetId === user.id);
      
      if (isMutual) {
        newMatch.mutual = true;
        
        // Also update the target's match to be mutual
        const updatedTargetMatches = targetMatches.map((match: Match) => {
          if (match.targetId === user.id) {
            return { ...match, mutual: true };
          }
          return match;
        });
        
        localStorage.setItem(`matches_${profileId}`, JSON.stringify(updatedTargetMatches));
      }
    };
    
    // Check mutual matches
    checkMutual();
    
    // Add match to state
    setMatches(prev => [...prev, newMatch]);
    
    // Call callback if provided
    if (callback) callback(newMatch.id);
  };

  // Get match by profile ID
  const getMatchByProfileId = (profileId: number) => {
    if (!user) return undefined;
    return matches.find(match => match.targetId === profileId.toString());
  };
  
  // Check if there's a mutual match
  const checkMutualMatch = (profileId: number) => {
    const match = getMatchByProfileId(profileId);
    return match ? match.mutual : false;
  };
  
  // Calculate compatibility score (0-100)
  const calculateCompatibility = (profileId: number) => {
    if (!user) return 0;
    
    // In a real app, this would use algorithms based on shared interests, quiz answers, etc.
    // For this demo, we'll just use a simple random but deterministic algorithm
    
    // Create a seed using user ID and profile ID
    const seed = parseInt(user.id) * profileId;
    
    // Use the seed to generate a deterministic random number between 65 and 95
    const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
    const score = Math.floor(65 + pseudoRandom * 30);
    
    return score;
  };

  return (
    <MatchContext.Provider
      value={{
      matches,
      likeProfile,
      getMatchByProfileId,
        checkMutualMatch,
        calculateCompatibility
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};