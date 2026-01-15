import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { votingAPI, trackUserAction } from '../services/api';

const VotingPage = () => {
  const navigate = useNavigate();
  const [votingOptions, setVotingOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: select product, 2: enter email, 3: success
  const [voteResult, setVoteResult] = useState(null);

  useEffect(() => {
    loadVotingOptions();
    trackUserAction(null, 'view_voting_page');
  }, []);

  const loadVotingOptions = async () => {
    try {
      const response = await votingAPI.getVotingOptions();
      setVotingOptions(response.data.data.voting_options || []);
    } catch (error) {
      console.error('Error loading voting options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (optionId) => {
    setSelectedOption(optionId);
    setStep(2);
    
    const selectedProduct = votingOptions.find(opt => opt.id === optionId);
    trackUserAction(null, 'select_voting_option', { 
      product_name: selectedProduct?.product_name,
      option_id: optionId 
    });
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !selectedOption) return;

    setSubmitting(true);
    
    try {
      const response = await votingAPI.castVote({
        email,
        voting_option_id: selectedOption
      });

      setVoteResult(response.data.data);
      setStep(3);
      
      // Store email in localStorage for future use
      localStorage.setItem('userEmail', email);
      
      trackUserAction(email, 'cast_vote', {
        product_voted: response.data.data.product_voted,
        is_new_user: response.data.data.is_new_user
      });

    } catch (error) {
      console.error('Error casting vote:', error);
      
      if (error.response?.status === 400) {
        alert(error.response.data.detail || 'You have already voted for this option');
      } else if (error.response?.status === 403) {
        alert(error.response.data.detail || 'Vote limit reached. Please upgrade to premium.');
      } else {
        alert('Failed to cast vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    trackUserAction(email, 'navigate_to_dashboard');
    navigate(`/dashboard?email=${encodeURIComponent(email)}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voting options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vote for Next Test
          </h1>
          <p className="text-lg text-gray-600">
            Which product should we test next? Your vote helps prioritize community testing.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Select Product */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-6">
              Choose a product to test:
            </h2>
            
            {votingOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleProductSelect(option.id)}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg cursor-pointer transition-shadow border-2 border-transparent hover:border-primary-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {option.product_name}
                      </h3>
                      <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                        {option.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>👥 {option.votes} votes</span>
                      <span>💰 {option.funding_percentage}% funded</span>
                      {option.estimated_test_date && (
                        <span>📅 Est. {option.estimated_test_date}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(option.funding_percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center text-gray-500">
                      ₹{option.funding_raised.toLocaleString()}/₹{option.funding_target.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Enter Email */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h2 className="text-xl font-semibold text-center mb-6">
                Cast Your Vote
              </h2>
              
              {/* Selected Product Summary */}
              {selectedOption && (
                <div className="bg-primary-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-primary-900">
                    {votingOptions.find(opt => opt.id === selectedOption)?.product_name}
                  </h3>
                  <p className="text-sm text-primary-700">
                    {votingOptions.find(opt => opt.id === selectedOption)?.description}
                  </p>
                </div>
              )}

              <form onSubmit={handleVoteSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    We'll notify you when test results are ready
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                  >
                    {submitting ? 'Voting...' : 'Vote Now'}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-center text-gray-500">
                Join {votingOptions.reduce((sum, opt) => sum + opt.votes, 0).toLocaleString()}+ parents making food safer
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && voteResult && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Vote Counted Successfully!
              </h2>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  Your vote for {voteResult.product_voted} has been counted
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Total votes: {voteResult.total_votes}
                </p>
              </div>

              {voteResult.is_new_user && (
                <div className="bg-primary-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-primary-900 mb-2">
                    Welcome to ChoosePure! 🎉
                  </h3>
                  <p className="text-sm text-primary-700">
                    We'll notify you when {voteResult.product_voted} test results are ready.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGoToDashboard}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-md transition-colors"
                >
                  View Your Dashboard
                </button>
                
                <button
                  onClick={handleBackToHome}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-md transition-colors"
                >
                  Back to Home
                </button>
              </div>

              {voteResult.votes_remaining !== undefined && voteResult.votes_remaining > 0 && (
                <p className="mt-4 text-sm text-gray-600">
                  You have {voteResult.votes_remaining} votes remaining this month
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingPage;