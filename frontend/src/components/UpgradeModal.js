import { useState } from 'react';
import { subscriptionAPI, trackUserAction } from '../services/api';

const UpgradeModal = ({ 
  isOpen, 
  onClose, 
  onStartTrial, 
  userEmail, 
  subscriptionStatus, 
  upgradePrompts = [] 
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      await onStartTrial();
      trackUserAction(userEmail, 'start_trial_from_modal');
    } catch (error) {
      console.error('Trial start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    setLoading(true);
    try {
      // Create payment order
      const orderResponse = await subscriptionAPI.createPaymentOrder({
        email: userEmail,
        tier_id: 'premium' // Using fixed tier instead of selectedTier
      });

      const { order_id, amount, currency, razorpay_key } = orderResponse.data.data;

      // Initialize Razorpay (in a real app, load Razorpay script)
      const options = {
        key: razorpay_key,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        name: 'ChoosePure',
        description: 'Premium Subscription',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await subscriptionAPI.verifyPayment({
              order_id: order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            trackUserAction(userEmail, 'complete_payment');
            alert('Payment successful! Premium features activated.');
            onClose();
            window.location.reload(); // Refresh to show premium status
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: userEmail
        },
        theme: {
          color: '#16a34a'
        }
      };

      // In a real app, you would use: const rzp = new window.Razorpay(options);
      // For demo purposes, we'll simulate the payment
      console.log('Would open Razorpay with options:', options);
      alert('Payment gateway would open here. This is a demo.');

      trackUserAction(userEmail, 'initiate_payment');
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const primaryPrompt = upgradePrompts.find(p => p.urgency === 'high') || upgradePrompts[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {primaryPrompt?.title || 'Upgrade to Premium'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          {primaryPrompt?.message && (
            <p className="text-gray-600 mt-2">{primaryPrompt.message}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Current Status */}
          {subscriptionStatus && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Current Plan: Free</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Report Views:</span>
                  <span>{subscriptionStatus.usage_stats.report_views.used}/{subscriptionStatus.usage_stats.report_views.limit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Votes:</span>
                  <span>{subscriptionStatus.usage_stats.votes.used}/{subscriptionStatus.usage_stats.votes.limit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Premium Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Premium Features</h3>
            <div className="space-y-3">
              {[
                'Unlimited test result access',
                'Detailed lab parameters',
                'Unlimited voting',
                'Priority voting on new tests',
                'Expert Q&A sessions',
                'Early access to new features'
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">₹99</div>
              <div className="text-gray-600">per month</div>
              <div className="text-sm text-gray-500 mt-1">Cancel anytime</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {subscriptionStatus?.trial_available && (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Starting Trial...' : 'Start 7-Day Free Trial'}
              </button>
            )}

            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Upgrade to Premium'}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continue with Free Plan
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>🔒 Secure Payment</span>
              <span>💳 All Cards Accepted</span>
              <span>↩️ Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;