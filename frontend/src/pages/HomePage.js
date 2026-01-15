import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleAPI, votingAPI, userAPI, trackUserAction } from '../services/api';
import FoodIcon from '../components/FoodIcon';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredReports, setFeaturedReports] = useState([]);
  const [votingOptions, setVotingOptions] = useState([]);
  const [communityStats, setCommunityStats] = useState({});
  const [loading, setLoading] = useState(true);

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
    document.getElementById('sample-reports').scrollIntoView({ behavior: 'smooth' });
  };

  const handleLearnMore = () => {
    trackUserAction(null, 'view_how_it_works');
    document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoteClick = () => {
    trackUserAction(null, 'initiate_voting');
    navigate('/vote');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching ChoosePure.org */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Do you really know what's<br />
              <span className="text-primary-600">In your child's food?</span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto">
              Join India's first parent-led community that tests food for purity. 
              Together, we ensure every child eats pure.
            </p>

            <button
              onClick={handleViewSampleReports}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg mb-8"
            >
              See Sample Test Reports
            </button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
                <span className="text-2xl mr-3">🧪</span>
                <span className="font-semibold text-gray-800">Global-Standard Testing</span>
              </div>
              <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
                <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                <span className="font-semibold text-gray-800">Driven By Parents</span>
              </div>
              <div className="flex items-center bg-white rounded-lg px-6 py-3 shadow-sm">
                <span className="text-2xl mr-3">📊</span>
                <span className="font-semibold text-gray-800">Reports You Can Trust</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why ChoosePure Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why ChoosePure?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Global-Standard Testing</h3>
              <p className="text-gray-600">
                Product is tested in certified labs following FSSAI, US FDA, and EFSA standards.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Driven By Parents</h3>
              <p className="text-gray-600">
                Tests are driven by parents, not brands — ensuring unbiased and transparent results.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Reports You Can Trust</h3>
              <p className="text-gray-600">
                Tests are community-funded, ensuring unbiased and transparent outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Food Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What We Test
            </h2>
            <p className="text-lg text-gray-600">
              From everyday staples to your child's favorite snacks
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
            {[
              { type: 'milk', name: 'Milk & Dairy', tested: 12 },
              { type: 'bread', name: 'Bread & Bakery', tested: 8 },
              { type: 'honey', name: 'Honey & Sweeteners', tested: 6 },
              { type: 'spices', name: 'Spices & Masalas', tested: 15 },
              { type: 'snacks', name: 'Kids Snacks', tested: 10 },
              { type: 'cereals', name: 'Cereals & Grains', tested: 9 },
              { type: 'oil', name: 'Cooking Oils', tested: 7 },
              { type: 'beverages', name: 'Beverages', tested: 5 },
              { type: 'fruits', name: 'Packaged Fruits', tested: 4 },
              { type: 'vegetables', name: 'Processed Veggies', tested: 6 },
              { type: 'dal', name: 'Pulses & Lentils', tested: 8 },
              { type: 'rice', name: 'Rice & Grains', tested: 11 }
            ].map((category, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                <FoodIcon type={category.type} size="text-3xl" />
                <h3 className="font-semibold text-sm mt-2 text-gray-900">{category.name}</h3>
                <p className="text-xs text-gray-600">{category.tested} products tested</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">Don't see your product category?</p>
            <button
              onClick={handleVoteClick}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Suggest New Products to Test
            </button>
          </div>
        </div>
      </section>

      {/* Sample Reports Section */}
      <section id="sample-reports" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sample Test Reports
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
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <FoodIcon type={report.category?.toLowerCase()} size="text-xl" />
                      </div>
                      <h3 className="font-bold text-lg">{report.product_name}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      report.safety_status === 'Safe' ? 'bg-primary-100 text-primary-800' :
                      report.safety_status === 'Caution' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.safety_status}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Purity Score</span>
                      <span className="font-bold text-2xl text-primary-600">{report.purity_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-primary-600 h-3 rounded-full" 
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works?</h2>
            <p className="text-lg text-gray-600">Parents Power the Tests</p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-5 gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Join as a parent</h3>
              <p className="text-gray-600 text-sm">Become part of our community</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗳️</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Vote for the product to test</h3>
              <p className="text-gray-600 text-sm">Choose what matters to you</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧪</span>
              </div>
              <h3 className="font-bold text-lg mb-2">We send product to lab</h3>
              <p className="text-gray-600 text-sm">Certified lab testing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-lg mb-2">You get the report</h3>
              <p className="text-gray-600 text-sm">Transparent results</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Spread awareness</h3>
              <p className="text-gray-600 text-sm">Help other parents</p>
            </div>
          </div>

          {/* Current Voting */}
          <div className="bg-primary-50 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-center mb-6">Current Community Voting:</h3>
            <div className="space-y-4">
              {votingOptions.slice(0, 2).map((option) => (
                <div key={option.id} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-semibold">{option.product_name}</h4>
                    <p className="text-sm text-gray-600">{option.votes} parents voted</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-600">
                      ₹{option.funding_raised.toLocaleString()}/₹{option.funding_target.toLocaleString()} funded
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
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
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
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

      {/* Food Safety Concerns Section */}
      <section className="py-16 bg-red-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stop Guessing. Start Testing.
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              The truth about our food is alarming - and we deserve to know...
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Fake Paneer */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FoodIcon type="paneer" size="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Fake Paneer</h3>
                  <p className="text-red-600 font-semibold">Detected detergent traces</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Many popular dairy products contain hidden chemicals - pesticides, detergents, starch, and even urea.
              </p>
              <div className="bg-red-100 rounded-lg p-3">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Found in 3 out of 5 popular paneer brands tested
                </p>
              </div>
            </div>

            {/* Adulterated Spices */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FoodIcon type="spices" size="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Adulterated Spices</h3>
                  <p className="text-red-600 font-semibold">Low Purity Score</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                1 in 5 foods in India is found to be adulterated. From turmeric laced with lead chromate to chili powder with textile dyes.
              </p>
              <div className="bg-red-100 rounded-lg p-3">
                <p className="text-red-800 text-sm font-semibold">
                  ⚠️ Added: Synthetic colorant, Suspected Adulteration
                </p>
              </div>
            </div>
          </div>

          <div className="text-center bg-white rounded-lg p-8 shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              What's Really in Your Food?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              And there's no easy way for parents like us to find out which brands are safe. 
              That's why ChoosePure exists — to make independent testing and real transparency accessible to every family.
            </p>
            <button
              onClick={handleViewSampleReports}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              See Real Test Results
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What do members say?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl">👨</span>
                </div>
                <div>
                  <h4 className="font-semibold">Rajesh</h4>
                  <p className="text-sm text-gray-600">Father of a 9-year-old</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I used to think all paneer brands were pure- until ChoosePure showed how much purity can really vary. Now I only trust what our community tests."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl">👩</span>
                </div>
                <div>
                  <h4 className="font-semibold">Ritu</h4>
                  <p className="text-sm text-gray-600">Mom of a 7 year old</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Finally someone's testing food for our kids, not just for brands. As a mom, I finally feel confident about what I buy."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl">👨</span>
                </div>
                <div>
                  <h4 className="font-semibold">Anil</h4>
                  <p className="text-sm text-gray-600">Bangalore</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "It's amazing to be a part of something that holds brands accountable"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Join {communityStats.total_members?.toLocaleString() || '1,000'} Responsible Parents
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            This isn't just a waitlist -- it's a national movement for truth in food.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-3xl font-bold">{communityStats.completed_tests || 25}+</div>
              <div className="text-primary-100">Products Tested</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{communityStats.total_votes_cast?.toLocaleString() || '5,000'}+</div>
              <div className="text-primary-100">Votes Cast</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{communityStats.active_voting_options || 8}</div>
              <div className="text-primary-100">Active Votes</div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6 mb-8">
            <p className="text-lg mb-4">
              Together, we crowd-fund certified tests on everyday products, publish transparent reports, and demand honesty from the food industry.
            </p>
            <p className="font-semibold">No sponsors. No bias. Join the movement</p>
          </div>

          <button
            onClick={handleVoteClick}
            className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Start Voting Now
          </button>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            When parents unite, purity wins
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            From one responsible parent to another: Let's stand together and take back control of what we feed our kids, ensuring every meal is wholesome, safe, and free from hidden risks—for their healthy future.
          </p>
          
          <button
            onClick={handleVoteClick}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
          >
            Be Part of the ChoosePure Movement
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;