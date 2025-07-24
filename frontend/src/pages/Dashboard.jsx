
import { Appbar } from "../components/AppBar"
import { useState, useEffect, useCallback } from "react"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import axios from "axios"
import { BACKEND_URL } from "../config";

export const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    ifsc: '',
    bankName: '',
    accountHolderName: ''
  });
  const [bankError, setBankError] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [editBankId, setEditBankId] = useState(null);
  const [editBankForm, setEditBankForm] = useState({
    accountNumber: '',
    ifsc: '',
    bankName: '',
    accountHolderName: ''
  });
  const [editBankError, setEditBankError] = useState('');
  const [editBankSubmitting, setEditBankSubmitting] = useState(false);
  const [deleteBankId, setDeleteBankId] = useState(null);
  const [deleteBankLoading, setDeleteBankLoading] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: '', bankAccountId: '' });
  const [addMoneyError, setAddMoneyError] = useState('');
  const [addMoneyLoading, setAddMoneyLoading] = useState(false);
  const [showAddMoneySuccess, setShowAddMoneySuccess] = useState(false);
  const [addMoneySuccessAmount, setAddMoneySuccessAmount] = useState(0);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [paymentFailedMsg, setPaymentFailedMsg] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [notification, setNotification] = useState(null);

  // Fetch bank accounts function
  const fetchBankAccounts = useCallback(async () => {
    setBankLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/v1/user/bankaccounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBankAccounts(response.data.bankAccounts || []);
    } catch (error) {
      setBankAccounts([]);
    } finally {
      setBankLoading(false);
    }
  }, []);

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/v1/account/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  // Add a function to fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/v1/account/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      setTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
    fetchBalance();
    fetchTransactions();
  }, [fetchBankAccounts, fetchBalance, fetchTransactions]);

  // Show only top 5 transactions
  const topTransactions = transactions.slice(0, 5);

  // Modal for all transactions
  const TransactionModal = ({ open, onClose, transactions }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg text-blue-600 font-bold">🧾</span>
            </div>
            <span className="text-lg font-bold text-blue-700">All Transactions</span>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No transactions</div>
          ) : (
            <ul className="divide-y divide-blue-50 max-h-96 overflow-y-auto">
              {transactions.map(txn => {
                const isWithdrawal = txn.description && txn.description.toLowerCase().includes('withdraw');
                const isSelfTopUp = txn.from && txn.to && txn.from._id === txn.to._id && !isWithdrawal;
                const isCredit = txn.to && txn.to._id === localStorage.getItem("userId");
                const otherParty = isSelfTopUp || isWithdrawal
                  ? null
                  : isCredit ? txn.from : txn.to;
                const name = isSelfTopUp
                  ? 'Wallet Top-Up'
                  : isWithdrawal
                    ? 'Withdraw to Bank'
                    : otherParty
                      ? (otherParty.firstName + " " + otherParty.lastName)
                      : "Unknown";
                let amountColor = isCredit ? 'text-green-500' : 'text-red-500';
                if (isSelfTopUp) amountColor = 'text-blue-500';
                if (isWithdrawal) amountColor = 'text-purple-600';
                const statusBadge = (status, description) => {
                  if (description !== 'Wallet Top-Up') return null;
                  if (status === 'pending') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">Pending</span>;
                  if (status === 'success') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-300">Success</span>;
                  if (status === 'failed') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 border border-red-300">Failed</span>;
                  return null;
                };
                return (
                  <li key={txn._id} className="py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isSelfTopUp ? 'text-blue-700' : isWithdrawal ? 'text-purple-700' : 'text-gray-700'}`}>{name}</span>
                      <span className="text-xs text-gray-400">{new Date(txn.date).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-bold ${amountColor}`}>{isSelfTopUp ? '+' : isWithdrawal ? '-' : (isCredit ? '+' : '-')} {Math.abs(txn.amount)} ₹{statusBadge(txn.status, txn.description)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // Modal for adding a bank account
  const AddBankModal = ({ open, onClose }) => {
    const [localBankForm, setLocalBankForm] = useState({
      accountNumber: '',
      ifsc: '',
      bankName: '',
      accountHolderName: ''
    });
    const [localBankError, setLocalBankError] = useState('');
    const [localBankSubmitting, setLocalBankSubmitting] = useState(false);
    useEffect(() => {
      if (open) {
        setLocalBankForm({ accountNumber: '', ifsc: '', bankName: '', accountHolderName: '' });
        setLocalBankError('');
      }
    }, [open]);
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="text-xl font-bold text-blue-700 mb-4">Add Bank Account</div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLocalBankError('');
            setLocalBankSubmitting(true);
            try {
              const token = localStorage.getItem("token");
              await axios.post(`${BACKEND_URL}/api/v1/user/bankaccounts`, localBankForm, {
                headers: { Authorization: `Bearer ${token}` },
              });
              await fetchBankAccounts();
              onClose();
            } catch (err) {
              setLocalBankError(err.response?.data?.message || 'Failed to add bank account');
            } finally {
              setLocalBankSubmitting(false);
            }
          }}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Account Number</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localBankForm.accountNumber} onChange={e => setLocalBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">IFSC Code</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localBankForm.ifsc} onChange={e => setLocalBankForm(f => ({ ...f, ifsc: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Bank Name</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localBankForm.bankName} onChange={e => setLocalBankForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Account Holder Name</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localBankForm.accountHolderName} onChange={e => setLocalBankForm(f => ({ ...f, accountHolderName: e.target.value }))} />
            </div>
            {localBankError && <div className="text-red-500 text-sm mb-2">{localBankError}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full py-2 mt-2 transition-all duration-200 shadow-md disabled:opacity-60" disabled={localBankSubmitting}>{localBankSubmitting ? 'Adding...' : 'Add Bank Account'}</button>
          </form>
        </div>
      </div>
    );
  };

  // Modal for editing a bank account
  const EditBankModal = ({ open, onClose, bank }) => {
    if (!open || !bank) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="text-xl font-bold text-blue-700 mb-4">Edit Bank Account</div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setEditBankError('');
            setEditBankSubmitting(true);
            try {
              const token = localStorage.getItem("token");
              await axios.put(`${BACKEND_URL}/api/v1/user/bankaccounts/${bank._id}`,
                editBankForm,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await fetchBankAccounts();
              setEditBankId(null);
            } catch (err) {
              setEditBankError(err.response?.data?.message || 'Failed to update bank account');
            } finally {
              setEditBankSubmitting(false);
            }
          }}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Account Number</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={editBankForm.accountNumber} onChange={e => setEditBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">IFSC Code</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={editBankForm.ifsc} onChange={e => setEditBankForm(f => ({ ...f, ifsc: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Bank Name</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={editBankForm.bankName} onChange={e => setEditBankForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Account Holder Name</label>
              <input type="text" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={editBankForm.accountHolderName} onChange={e => setEditBankForm(f => ({ ...f, accountHolderName: e.target.value }))} />
            </div>
            {editBankError && <div className="text-red-500 text-sm mb-2">{editBankError}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full py-2 mt-2 transition-all duration-200 shadow-md disabled:opacity-60" disabled={editBankSubmitting}>{editBankSubmitting ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>
    );
  };

  // Modal for confirming delete
  const DeleteBankModal = ({ open, onClose, onDelete }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="text-lg font-bold text-blue-700 mb-4">Delete Bank Account</div>
          <div className="mb-4">Are you sure you want to delete this bank account?</div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold" onClick={onClose}>Cancel</button>
            <button className="px-4 py-1 rounded-full bg-red-500 text-white font-semibold" onClick={onDelete} disabled={deleteBankLoading}>{deleteBankLoading ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal for adding money
  const AddMoneyModal = ({ open, onClose, bankAccounts }) => {
    const [localAddMoneyForm, setLocalAddMoneyForm] = useState({ amount: '', bankAccountId: '' });
    const [localAddMoneyError, setLocalAddMoneyError] = useState('');
    const [localAddMoneyLoading, setLocalAddMoneyLoading] = useState(false);
    useEffect(() => {
      if (open) {
        setLocalAddMoneyForm({ amount: '', bankAccountId: '' });
        setLocalAddMoneyError('');
      }
    }, [open]);
    if (!open) return null;
    const handleRazorpay = async (e) => {
      e.preventDefault();
      setLocalAddMoneyError('');
      setLocalAddMoneyLoading(true);
      try {
        const token = localStorage.getItem("token");
        // 1. Create Razorpay order
        const orderRes = await axios.post(`${BACKEND_URL}/api/v1/account/razorpay-order`, {
          amount: Number(localAddMoneyForm.amount)
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const order = orderRes.data.order;
        // 2. Open Razorpay Checkout
        const options = {
          key: "rzp_test_SBsvBa2drCvA0C", // Test key, safe to expose
          amount: order.amount,
          currency: order.currency,
          name: "PayTM Clone",
          description: "Wallet Top-Up",
          order_id: order.id,
          handler: async function (response) {
            // 3. Verify payment signature
            try {
              const verifyRes = await axios.post(`${BACKEND_URL}/api/v1/account/verify-razorpay-payment`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (verifyRes.data.success) {
                // 4. On verification success, credit wallet with status 'success'
                await axios.post(`${BACKEND_URL}/api/v1/account/add-money`, {
                  amount: Number(localAddMoneyForm.amount),
                  bankAccountId: localAddMoneyForm.bankAccountId,
                  status: 'success'
                }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                await fetchBalance();
                await fetchTransactions();
                onClose();
                setShowAddMoneySuccess(true);
                setAddMoneySuccessAmount(Number(localAddMoneyForm.amount));
                setNotification({ type: 'success', message: 'Money Added', status: 'success', amount: Number(localAddMoneyForm.amount) });
              } else {
                // 4b. On verification failure, record as failed
                await axios.post(`${BACKEND_URL}/api/v1/account/add-money`, {
                  amount: Number(localAddMoneyForm.amount),
                  bankAccountId: localAddMoneyForm.bankAccountId,
                  status: 'failed'
                }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setShowPaymentFailed(true);
                setPaymentFailedMsg('Payment verification failed.');
                setNotification({ type: 'error', message: 'Add Money Failed', status: 'failed', amount: Number(localAddMoneyForm.amount) });
              }
            } catch (err) {
              await axios.post(`${BACKEND_URL}/api/v1/account/add-money`, {
                amount: Number(localAddMoneyForm.amount),
                bankAccountId: localAddMoneyForm.bankAccountId,
                status: 'failed'
              }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setShowPaymentFailed(true);
              setPaymentFailedMsg('Payment verification failed.');
              setNotification({ type: 'error', message: 'Add Money Failed', status: 'failed', amount: Number(localAddMoneyForm.amount) });
            }
            setLocalAddMoneyLoading(false);
          },
          prefill: {
            name: "Test User",
            email: "test@example.com"
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: function () {
              setLocalAddMoneyLoading(false);
              setShowPaymentFailed(true);
              setPaymentFailedMsg('Payment was cancelled or failed.');
              setNotification({ type: 'error', message: 'Add Money Failed', status: 'failed', amount: Number(localAddMoneyForm.amount) });
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        setLocalAddMoneyError(err.response?.data?.message || 'Failed to initiate payment');
        setLocalAddMoneyLoading(false);
        setNotification({ type: 'error', message: 'Add Money Failed', status: 'failed', amount: Number(localAddMoneyForm.amount) });
      }
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="text-xl font-bold text-blue-700 mb-4">Add Money to Wallet</div>
          <form onSubmit={handleRazorpay}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Bank Account</label>
              <select className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localAddMoneyForm.bankAccountId} onChange={e => setLocalAddMoneyForm(f => ({ ...f, bankAccountId: e.target.value }))}>
                <option value="" disabled>Select a bank account</option>
                {bankAccounts.map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.bankName} ({acc.accountNumber})</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Amount</label>
              <input type="number" min="1" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localAddMoneyForm.amount} onChange={e => setLocalAddMoneyForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {localAddMoneyError && <div className="text-red-500 text-sm mb-2">{localAddMoneyError}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full py-2 mt-2 transition-all duration-200 shadow-md disabled:opacity-60" disabled={localAddMoneyLoading}>{localAddMoneyLoading ? 'Processing...' : 'Add Money'}</button>
          </form>
        </div>
      </div>
    );
  };

  // Success animation/receipt modal
  const AddMoneySuccessModal = ({ open, amount, onClose }) => {
    if (!open) return null;
    // Auto-close after 2 seconds
    setTimeout(() => { onClose(); }, 2000);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 relative animate-slideup mx-2 flex flex-col items-center">
          <div className="mb-2">
            <svg className="w-16 h-16 text-green-500 animate-bounceIn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#dcfce7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2l4-4" />
            </svg>
          </div>
          <div className="text-lg font-bold text-green-600 mb-1">Money Added!</div>
          <div className="text-blue-700 font-semibold text-xl mb-2">+{amount} ₹</div>
          <button className="mt-2 px-4 py-1 rounded-full bg-blue-500 text-white font-semibold" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  };

  // Payment Failed Modal
  const PaymentFailedModal = ({ open, message, onClose }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 relative animate-slideup mx-2 flex flex-col items-center">
          <div className="mb-2">
            <svg className="w-16 h-16 text-red-400 animate-bounceIn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fee2e2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
            </svg>
          </div>
          <div className="text-lg font-bold text-red-500 mb-1">Payment Failed</div>
          <div className="text-gray-700 text-center mb-2">{message}</div>
          <button className="mt-2 px-4 py-1 rounded-full bg-blue-500 text-white font-semibold" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  };

  // Withdraw Modal
  const WithdrawModal = ({ open, onClose, bankAccounts, balance }) => {
    const [localWithdrawForm, setLocalWithdrawForm] = useState({ amount: '', bankAccountId: '' });
    const [localWithdrawError, setLocalWithdrawError] = useState('');
    const [localWithdrawLoading, setLocalWithdrawLoading] = useState(false);
    useEffect(() => {
      if (open) {
        setLocalWithdrawForm({ amount: '', bankAccountId: '' });
        setLocalWithdrawError('');
      }
    }, [open]);
    if (!open) return null;
    const handleWithdraw = async (e) => {
      e.preventDefault();
      setLocalWithdrawError('');
      setLocalWithdrawLoading(true);
      if (Number(localWithdrawForm.amount) > balance) {
        setLocalWithdrawError('Insufficient wallet balance');
        setLocalWithdrawLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        await axios.post(`${BACKEND_URL}/api/v1/account/withdraw`, {
          amount: Number(localWithdrawForm.amount),
          bankAccountId: localWithdrawForm.bankAccountId
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchBalance();
        await fetchBankAccounts();
        await fetchTransactions();
        onClose();
        setWithdrawSuccess(true);
        setWithdrawAmount(Number(localWithdrawForm.amount));
        setNotification({ type: 'success', message: 'Withdrawn to Bank', amount: -Number(localWithdrawForm.amount) });
      } catch (err) {
        setLocalWithdrawError(err.response?.data?.message || 'Failed to withdraw');
        setNotification({ type: 'error', message: 'Withdraw Failed' });
      } finally {
        setLocalWithdrawLoading(false);
      }
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slideup mx-2">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold" onClick={onClose}>&times;</button>
          <div className="text-xl font-bold text-blue-700 mb-4">Withdraw to Bank</div>
          <form onSubmit={handleWithdraw}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Bank Account</label>
              <select className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localWithdrawForm.bankAccountId} onChange={e => setLocalWithdrawForm(f => ({ ...f, bankAccountId: e.target.value }))}>
                <option value="" disabled>Select a bank account</option>
                {bankAccounts.map(acc => (
                  <option key={acc._id} value={acc._id}>{acc.bankName} ({acc.accountNumber})</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">Amount</label>
              <input type="number" min="1" className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" required value={localWithdrawForm.amount} onChange={e => setLocalWithdrawForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {localWithdrawError && <div className="text-red-500 text-sm mb-2">{localWithdrawError}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full py-2 mt-2 transition-all duration-200 shadow-md disabled:opacity-60" disabled={localWithdrawLoading}>{localWithdrawLoading ? 'Processing...' : 'Withdraw'}</button>
          </form>
        </div>
      </div>
    );
  };

  // Withdraw Success Modal
  const WithdrawSuccessModal = ({ open, amount, onClose }) => {
    if (!open) return null;
    setTimeout(() => { onClose(); }, 2000);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 relative animate-slideup mx-2 flex flex-col items-center">
          <div className="mb-2">
            <svg className="w-16 h-16 text-blue-500 animate-bounceIn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#dbeafe" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2l4-4" />
            </svg>
          </div>
          <div className="text-lg font-bold text-blue-600 mb-1">Withdrawal Successful!</div>
          <div className="text-blue-700 font-semibold text-xl mb-2">-{amount} ₹</div>
          <button className="mt-2 px-4 py-1 rounded-full bg-blue-500 text-white font-semibold" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  };

  // Notification component
  const Notification = ({ notification, onClose }) => {
    if (!notification) return null;
    const { type, message, status, amount } = notification;
    let bg = 'bg-blue-500';
    if (type === 'success') bg = 'bg-green-500';
    if (type === 'error') bg = 'bg-red-500';
    if (type === 'info') bg = 'bg-blue-500';
    return (
      <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 ${bg} animate-fadein`}>
        <div className="font-bold text-lg">{message}</div>
        {amount !== undefined && <div className="ml-2 font-semibold">{amount > 0 ? '+' : ''}{amount} ₹</div>}
        {status && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${status === 'success' ? 'bg-green-100 text-green-800' : status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} border`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>}
        <button className="ml-4 text-white text-xl font-bold" onClick={onClose}>&times;</button>
      </div>
    );
  };
  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 animate-fadein">
      <Appbar />
      <TransactionModal open={showModal} onClose={() => setShowModal(false)} transactions={transactions} />
      <AddBankModal open={showBankModal} onClose={() => setShowBankModal(false)} />
      <EditBankModal open={!!editBankId} onClose={() => setEditBankId(null)} bank={bankAccounts.find(b => b._id === editBankId)} />
      <DeleteBankModal open={!!deleteBankId} onClose={() => setDeleteBankId(null)} onDelete={async () => {
        setDeleteBankLoading(true);
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${BACKEND_URL}/api/v1/user/bankaccounts/${deleteBankId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchBankAccounts();
          setDeleteBankId(null);
        } catch (err) {
          // Optionally show error
        } finally {
          setDeleteBankLoading(false);
        }
      }} />
      <AddMoneyModal open={showAddMoneyModal} onClose={() => setShowAddMoneyModal(false)} bankAccounts={bankAccounts} />
      <AddMoneySuccessModal open={showAddMoneySuccess} amount={addMoneySuccessAmount} onClose={() => setShowAddMoneySuccess(false)} />
      <PaymentFailedModal open={showPaymentFailed} message={paymentFailedMsg} onClose={() => setShowPaymentFailed(false)} />
      <WithdrawModal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} bankAccounts={bankAccounts} balance={balance} />
      <WithdrawSuccessModal open={withdrawSuccess} amount={withdrawAmount} onClose={() => setWithdrawSuccess(false)} />
      <Notification notification={notification} onClose={() => setNotification(null)} />
      <div className="flex flex-col md:flex-row items-center justify-center min-h-[80vh] w-full max-w-7xl mx-auto px-2 md:px-6 gap-8 py-8 md:py-16">
        {/* Sidebar */}
        <aside className="w-full md:w-80 mb-8 md:mb-0 md:mr-6 animate-slideup flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg text-blue-600 font-bold">🧾</span>
              </div>
              <span className="text-lg font-bold text-blue-700">Recent Transactions</span>
            </div>
            {loadingTxns ? (
              <div className="text-center text-blue-400 py-8">Loading...</div>
            ) : topTransactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No transactions</div>
            ) : (
              <ul className="divide-y divide-blue-50">
                {topTransactions.map(txn => {
                  const isWithdrawalTop = txn.description && txn.description.toLowerCase().includes('withdraw');
                  const isSelfTopUpTop = txn.from && txn.to && txn.from._id === txn.to._id && !isWithdrawalTop;
                  const isCredit = txn.to && txn.to._id === localStorage.getItem("userId");
                  const otherParty = isSelfTopUpTop || isWithdrawalTop
                    ? null
                    : isCredit ? txn.from : txn.to;
                  const name = isSelfTopUpTop
                    ? 'Wallet Top-Up'
                    : isWithdrawalTop
                      ? 'Withdraw to Bank'
                      : otherParty
                        ? (otherParty.firstName + " " + otherParty.lastName)
                        : "Unknown";
                  let amountColor = isCredit ? 'text-green-500' : 'text-red-500';
                  if (isSelfTopUpTop) amountColor = 'text-blue-500';
                  if (isWithdrawalTop) amountColor = 'text-purple-600';
                  const statusBadge = (status, description) => {
                    if (description !== 'Wallet Top-Up') return null;
                    if (status === 'pending') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">Pending</span>;
                    if (status === 'success') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-300">Success</span>;
                    if (status === 'failed') return <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 border border-red-300">Failed</span>;
                    return null;
                  };
                  return (
                    <li key={txn._id} className="py-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${isSelfTopUpTop ? 'text-blue-700' : isWithdrawalTop ? 'text-purple-700' : 'text-gray-700'}`}>{name}</span>
                        <span className="text-xs text-gray-400">{new Date(txn.date).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-bold ${amountColor}`}>{isSelfTopUpTop ? '+' : isWithdrawalTop ? '-' : (isCredit ? '+' : '-')} {Math.abs(txn.amount)} ₹{statusBadge(txn.status, txn.description)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex justify-center mt-4">
              {transactions.length > 5 && (
                <button className="text-blue-600 font-semibold hover:underline px-3 py-1 rounded transition-colors duration-150" onClick={() => setShowModal(true)}>
                  Show more
                </button>
              )}
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full max-w-xl bg-white shadow-2xl rounded-3xl p-8 transition-transform duration-300 hover:scale-105 animate-slideup">
            {/* Add Money Button */}
            <div className="w-full flex justify-end mb-4">
              <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-full px-6 py-2 shadow hover:scale-105 transition-all" onClick={() => setShowAddMoneyModal(true)}>
                + Add Money
              </button>
            </div>
            {/* Withdraw Button */}
            <div className="w-full flex justify-end mb-2">
              <button className="bg-gradient-to-r from-blue-400 to-blue-700 text-white font-semibold rounded-full px-6 py-2 shadow hover:scale-105 transition-all" onClick={() => setShowWithdrawModal(true)}>
                Withdraw to Bank
              </button>
            </div>
            <Balance value={balance} />
            {/* Linked Bank Accounts Section */}
            <div className="w-full mt-8 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-blue-700">Linked Bank Accounts</div>
                <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full px-4 py-1 shadow hover:scale-105 transition-all" onClick={() => setShowBankModal(true)}>
                  + Add Bank Account
                </button>
              </div>
              {bankLoading ? (
                <div className="text-blue-400 py-4">Loading...</div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-gray-400 py-4">No bank accounts linked</div>
              ) : (
                <ul className="divide-y divide-blue-50">
                  {bankAccounts.map(acc => (
                    <li key={acc._id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{acc.bankName} ({acc.accountNumber})</span>
                        <span className="text-xs text-gray-400">IFSC: {acc.ifsc} | Holder: {acc.accountHolderName}</span>
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <button className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-all" onClick={() => {
                          setEditBankId(acc._id);
                          setEditBankForm({
                            accountNumber: acc.accountNumber,
                            ifsc: acc.ifsc,
                            bankName: acc.bankName,
                            accountHolderName: acc.accountHolderName
                          });
                        }}>Edit</button>
                        <button className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-all" onClick={() => setDeleteBankId(acc._id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Users Section */}
            <div className="w-full mt-6">
              <Users />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Animations (add to global CSS or Tailwind config if needed):
// .animate-fadein { animation: fadein 0.7s; }
// .animate-slideup { animation: slideup 0.7s; }
// @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideup { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }