import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleAPI, votingAPI, userAPI, trackUserAction } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredReports, setFeaturedReports] = useState([]);
  const [votingOptions, setVotingOptions] = useState([]);
  const [communityStats, setCommunityStats] = useState({});
  const [loading, setLoading] = useState(true);
  // Removed unused currentStep state

  useEffect(() => {
    loadHomepageData();
    trackUserAction(null, 'view_homepage');
  }, []);

  const loadHomepageData = async () => {
    try {
      const [featuredRes, votingRes, statsRes] = await Promise.all([
        sampleAPI.getFeaturedReports(),
        votingAPI.getVotingOptions(),
        userAPI.getCommunityStats()
      ]);

      setFeaturedReports(featuredRes.data.data.featured_reports || []);
      setVotingOptions(votingRes.data.data.voting_options || []);
      setCommunityStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSampleReports = () => {
    trackUserAction(null, 'view_sample_reports');
    // Scroll to sample reports section
    document.getElementById('sample-reports').scrollIntoView({ behavior: 'smooth' });
  };

  const handleLearnMore = () => {
    trackUserAction(null, 'view_how_it_works');
    // Scroll to how it works section
    document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoteClick = () => {
    trackUserAction(null, 'initiate_voting');
    navigate('/vote');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Simplified */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            India's First Parent-Led<br />
            <span className="text-blue-600">Food Testing Community</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get real lab results on everyday food products. Join {communityStats.total_members?.toLocaleString() || '10,000+'} parents making food safer for our children.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
              <span className="text-2xl mr-3">🧪</span>
              <span className="font-semibold">Real Lab Results</span>
            </div>
            <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
              <span className="text-2xl mr-3">👥</span>
              <span className="font-semibold">{communityStats.total_members?.toLocaleString() || '10,000+'} Parents</span>
            </div>
            <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
              <span className="text-2xl mr-3">💰</span>
              <span className="font-semibold">Fund Tests Together</span>
            </div>
            <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
              <span className="text-2xl mr-3">🔍</span>
              <span className="font-semibold">Unbiased Reports</span>
            </div>
          </div>

          {/* Single Primary CTA */}
          <button
            onClick={handleViewSampleReports}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
          >
            See Sample Test Results
          </button>
        </div>
      </section>

      {/* Sample Reports Section */}
      <section id="sample-reports" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sample Test Results
            </h2>
            <p className="text-lg text-gray-600">
              These are real lab results funded by parents like you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {featuredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{report.product_name}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      report.safety_status === 'Safe' ? 'bg-green-100 text-green-800' :
                      report.safety_status === 'Caution' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.safety_status}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Purity Score</span>
                      <span className="font-bold text-2xl text-blue-600">{report.purity_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(report.purity_score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{report.key_finding}</p>
                  
                  <div className="text-xs text-gray-500">
                    Brand: {report.brand} • Category: {report.category}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleLearnMore}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              See How We Test Products ↓
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple, transparent, community-driven
            </p>
          </div>

          {/* Process Steps */}
          <div className="flex flex-col md:flex-row items-center justify-center mb-12 space-y-8 md:space-y-0 md:space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Parents Vote</h3>
              <p className="text-gray-600">Choose products to test</p>
            </div>
            
            <div className="hidden md:block text-2xl text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-bold text-lg mb-2">We Fund Tests</h3>
              <p className="text-gray-600">Community funds lab testing</p>
            </div>
            
            <div className="hidden md:block text-2xl text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Get Results</h3>
              <p className="text-gray-600">Transparent lab reports</p>
            </div>
          </div>

          {/* Current Voting */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-center mb-6">Current Voting:</h3>
            <div className="space-y-4">
              {votingOptions.slice(0, 2).map((option) => (
                <div key={option.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{option.product_name}</h4>
                    <p className="text-sm text-gray-600">{option.votes} votes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      ₹{option.funding_raised.toLocaleString()}/₹{option.funding_target.toLocaleString()} funded
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${option.funding_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleVoteClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Vote for Next Test
            </button>
            <button
              onClick={() => navigate('/community')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Join Our Community
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Join {communityStats.total_members?.toLocaleString() || '10,000+'} Parents Making Food Safer
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-3xl font-bold">{communityStats.completed_tests || 25}+</div>
              <div className="text-blue-100">Products Tested</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{communityStats.total_votes_cast?.toLocaleString() || '5,000'}+</div>
              <div className="text-blue-100">Votes Cast</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{communityStats.active_voting_options || 8}</div>
              <div className="text-blue-100">Active Votes</div>
            </div>
          </div>

          <button
            onClick={handleVoteClick}
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Start Voting Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;