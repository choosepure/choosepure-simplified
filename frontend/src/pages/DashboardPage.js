import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userAPI, subscriptionAPI, trackUserAction } from '../services/api';
import UpgradeModal from '../components/UpgradeModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [upgradePrompts, setUpgradePrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('userEmail');
    const userEmail = emailParam || storedEmail;

    if (!userEmail) {
      navigate('/');
      return;
    }

    setEmail(userEmail);
    loadDashboardData(userEmail);
    trackUserAction(userEmail, 'view_dashboard');
  }, [searchParams, navigate]);

  const loadDashboardData = async (userEmail) => {
    try {
      const [dashboardRes, subscriptionRes, promptsRes] = await Promise.all([
        userAPI.getDashboard(userEmail),
        subscriptionAPI.getStatus(userEmail),
        subscriptionAPI.getUpgradePrompts(userEmail)
      ]);

      setDashboardData(dashboardRes.data.data);
      setSubscriptionStatus(subscriptionRes.data.data);
      setUpgradePrompts(promptsRes.data.data.prompts || []);

      // Show upgrade modal if user hit limits
      if (dashboardRes.data.data.upgrade_prompt?.show) {
        setShowUpgradeModal(true);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error.response?.status === 404) {
        // User not found, redirect to home
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      await subscriptionAPI.startTrial({ email });
      trackUserAction(email, 'start_trial');
      
      // Reload dashboard data
      await loadDashboardData(email);
      setShowUpgradeModal(false);
      
      alert('Premium trial started! You now have unlimited access for 7 days.');
    } catch (error) {
      console.error('Error starting trial:', error);
      alert(error.response?.data?.detail || 'Failed to start trial');
    }
  };

  const handleCompleteProfile = () => {
    navigate(`/complete-profile?email=${encodeURIComponent(email)}`);
  };

  const handleViewReports = () => {
    trackUserAction(email, 'navigate_to_reports');
    navigate('/reports');
  };

  const handleVoteMore = () => {
    trackUserAction(email, 'navigate_to_voting');
    navigate('/vote');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const { user_info, stats, recent_votes, recent_activity, limits } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome{user_info.name ? `, ${user_info.name}` : ''}!
              </h1>
              <p className="text-gray-600">
                Member since {new Date(user_info.member_since).toLocaleDateString()}
              </p>
            </div>
            
            {subscriptionStatus?.is_premium ? (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg">
                <span className="font-semibold">Premium Member</span>
                {subscriptionStatus.days_remaining > 0 && (
                  <div className="text-xs">
                    {subscriptionStatus.days_remaining} days remaining
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">🗳️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.votes_cast}</h3>
                <p className="text-gray-600">Votes Cast</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.tests_influenced}</h3>
                <p className="text-gray-600">Tests Influenced</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{stats.community_impact.toLocaleString()}</h3>
                <p className="text-gray-600">Parents Helped</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {stats.is_premium ? '∞' : stats.report_views_remaining}
                </h3>
                <p className="text-gray-600">Report Views Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Limits (for non-premium users) */}
        {!stats.is_premium && (
          <div className="bg-white rounded-lg p-6 shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Usage This Month</h2>
            
            <div className="space-y-4">
              {/* Report Views */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Report Views</span>
                  <span className="text-sm text-gray-500">
                    {limits.report_views.used}/{limits.report_views.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      limits.report_views.remaining === 0 ? 'bg-red-500' : 
                      limits.report_views.remaining <= 1 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(limits.report_views.used / limits.report_views.limit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Votes */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Votes</span>
                  <span className="text-sm text-gray-500">
                    {limits.votes.used}/{limits.votes.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      limits.votes.remaining === 0 ? 'bg-red-500' : 
                      limits.votes.remaining <= 1 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(limits.votes.used / limits.votes.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {(limits.report_views.remaining === 0 || limits.votes.remaining === 0) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  You've reached your free limits! Upgrade to Premium for unlimited access.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Votes */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Votes</h2>
              <button
                onClick={handleVoteMore}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Vote More →
              </button>
            </div>

            {recent_votes.length > 0 ? (
              <div className="space-y-3">
                {recent_votes.map((vote, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{vote.product_name}</h3>
                      <p className="text-sm text-gray-600">{vote.votes} total votes</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        vote.status === 'completed' ? 'bg-green-100 text-green-800' :
                        vote.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                        vote.status === 'funded' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vote.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {vote.funding_progress}% funded
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🗳️</span>
                <p className="text-gray-600 mb-4">You haven't voted yet</p>
                <button
                  onClick={handleVoteMore}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  Cast Your First Vote
                </button>
              </div>
            )}
          </div>

          {/* Community Activity */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Community Activity</h2>
              <button
                onClick={handleViewReports}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All Reports →
              </button>
            </div>

            <div className="space-y-3">
              {recent_activity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <span className="text-sm">
                      {activity.type === 'test_completed' ? '🧪' : '📊'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Completion Prompt */}
        {!user_info.name && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Complete Your Profile</h3>
                <p className="text-blue-700">Add your name and get personalized recommendations</p>
              </div>
              <button
                onClick={handleCompleteProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            onStartTrial={handleStartTrial}
            userEmail={email}
            subscriptionStatus={subscriptionStatus}
            upgradePrompts={upgradePrompts}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;