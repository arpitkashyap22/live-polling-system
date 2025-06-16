import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PollResults as PollResultsType } from '../store/pollSlice';
import { BarChart3, Users, Trophy } from 'lucide-react';

interface PollResultsProps {
  results: {
    pollId: string;
    question: string;
    options: string[];
    totalVotes: number;
    totalStudents: number;
    results?: Record<string, number>;
    votes?: Record<string, number>;
    status?: 'active' | 'closed';
    correctAnswer?: string;
    correctAnswers?: number;
    correctPercentage?: number;
  };
  isTeacher: boolean;
}

const PollResults: React.FC<PollResultsProps> = ({ results, isTeacher }) => {
  if (!results || (!results.results && !results.votes)) {
    return <div>No results available</div>;
  }

  const totalVotes = results.totalVotes || 0;
  const totalStudents = results.totalStudents || 0;
  const isActive = results.status === 'active';
  const voteData = results.results || results.votes || {};

  const maxVotes = Math.max(...Object.values(voteData));
  const winningOptions = Object.entries(voteData)
    .filter(([_, votes]) => votes === maxVotes && maxVotes > 0)
    .map(([option]) => option);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="[font-family:'Sora',Helvetica] flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Poll Results
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalVotes} votes
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Live Results' : 'Final Results'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="[font-family:'Sora',Helvetica] text-lg font-semibold mb-4">
            {results.question}
          </h3>
          
          {isActive && (
            <div className="mb-4 text-sm text-blue-600">
              Poll is active - waiting for responses...
            </div>
          )}
          
          <div className="space-y-3">
            {results.options.map((option, index) => {
              const votes = voteData[option] || 0;
              const percentage = getPercentage(votes);
              const isWinning = winningOptions.includes(option) && maxVotes > 0;
              const isCorrect = option === results.correctAnswer;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-500 text-sm">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="[font-family:'Sora',Helvetica] font-medium">
                        {option}
                      </span>
                      {isCorrect && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Correct Answer
                        </span>
                      )}
                      {isWinning && !isCorrect && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="[font-family:'Sora',Helvetica] font-semibold">
                        {votes} votes
                      </span>
                      <span className="[font-family:'Sora',Helvetica] text-gray-600">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isCorrect
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : isWinning 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalVotes === 0 && (
            <div className="text-center text-gray-500 py-4 [font-family:'Sora',Helvetica]">
              No votes yet
            </div>
          )}

          {isTeacher && isActive && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 [font-family:'Sora',Helvetica]">
                <strong>Live Results:</strong> Results update in real-time as students submit their answers.
                {totalStudents > totalVotes && (
                  <span> Waiting for {totalStudents - totalVotes} more students.</span>
                )}
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p>Total votes: {totalVotes}</p>
            <p>Total students: {totalStudents}</p>
            {results.correctAnswer && (
              <>
                <p className="text-green-600">
                  Correct answers: {results.correctAnswers || 0} ({results.correctPercentage || 0}%)
                </p>
              </>
            )}
            {isActive && totalStudents > totalVotes && (
              <p>Waiting for {totalStudents - totalVotes} more students to vote</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PollResults;