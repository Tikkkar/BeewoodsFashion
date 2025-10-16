import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package,
  Download, Loader2, RefreshCw, Award, Clock, CheckCircle, XCircle
} from 'lucide-react';
import {
  getSalesAnalytics,
  getTopProducts,
  getCategoryPerformance,
  getOrderStatusDistribution,
  getCustomerStats,
  getRevenueByHour,
  getComparisonData
} from '../../lib/api/analytics';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start;
    
    switch (timeRange) {
      case '7days':
        start = startOfDay(subDays(end, 6));
        break;
      case '30days':
        start = startOfDay(subDays(end, 29));
        break;
      case '3months':
        start = startOfMonth(subMonths(end, 2));
        break;
      case 'year':
        start = startOfMonth(subMonths(end, 11));
        break;
      default:
        start = startOfDay(subDays(end, 6));
    }
    
    return { start, end };
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const [
        sales,
        products,
        categories,
        statuses,
        customers,
        hourly
      ] = await Promise.all([
        getSalesAnalytics(start.toISOString(), end.toISOString()),
        getTopProducts(10, start.toISOString(), end.toISOString()),
        getCategoryPerformance(start.toISOString(), end.toISOString()),
        getOrderStatusDistribution(start.toISOString(), end.toISOString()),
        getCustomerStats(start.toISOString(), end.toISOString()),
        getRevenueByHour(new Date())
      ]);

      const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const prevEnd = startOfDay(subDays(start, 1));
      const prevStart = startOfDay(subDays(prevEnd, periodDays - 1));
      
      const comp = await getComparisonData(
        start.toISOString(),
        end.toISOString(),
        prevStart.toISOString(),
        prevEnd.toISOString()
      );

      setSalesData(sales);
      setTopProducts(products);
      setCategoryData(categories);
      setStatusData(statuses);
      setCustomerStats(customers);
      setHourlyData(hourly);
      setComparison(comp);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthBgColor = (value) => {
    return value >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  // Enhanced chart colors
  const CHART_COLORS = {
    primary: '#000000',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1'
  };

  const STATUS_COLORS = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipping: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') || entry.name.includes('revenue') 
                ? formatPrice(entry.value) 
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-16 h-16 animate-spin text-black mb-4" />
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  const hasData = salesData.length > 0 || topProducts.length > 0 || statusData.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">Detailed insights into your store performance</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Package size={48} className="text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">No Data Available Yet</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
            Start selling to see beautiful analytics here. Create some orders or wait for customer purchases.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={loadAnalytics}
              className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} />
              Refresh Data
            </button>
            <Link
              to="/admin/orders"
              className="px-8 py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-black transition font-medium shadow-lg hover:shadow-xl"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Monitor your store's performance in real-time</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium bg-white shadow-sm hover:shadow-md transition"
          >
            <option value="7days">📅 Last 7 Days</option>
            <option value="30days">📅 Last 30 Days</option>
            <option value="3months">📅 Last 3 Months</option>
            <option value="year">📅 Last Year</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm hover:shadow-md"
            title="Refresh data"
          >
            <RefreshCw size={20} />
          </button>

          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium shadow-md hover:shadow-lg">
            <Download size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid - Enhanced */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="text-white" size={28} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getGrowthBgColor(comparison.growth.revenue)} ${getGrowthColor(comparison.growth.revenue)}`}>
                  {getGrowthIcon(comparison.growth.revenue)}
                  <span className="text-sm">{Math.abs(comparison.growth.revenue).toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold mb-2 text-gray-900">{formatPrice(comparison.current.revenue)}</p>
              <p className="text-xs text-gray-500">vs {formatPrice(comparison.previous.revenue)} last period</p>
            </div>
          </div>

          {/* Orders Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="text-white" size={28} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getGrowthBgColor(comparison.growth.orders)} ${getGrowthColor(comparison.growth.orders)}`}>
                  {getGrowthIcon(comparison.growth.orders)}
                  <span className="text-sm">{Math.abs(comparison.growth.orders).toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold mb-2 text-gray-900">{formatNumber(comparison.current.orders)}</p>
              <p className="text-xs text-gray-500">vs {formatNumber(comparison.previous.orders)} last period</p>
            </div>
          </div>

          {/* AOV Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="text-white" size={28} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium ${getGrowthBgColor(comparison.growth.avgOrderValue)} ${getGrowthColor(comparison.growth.avgOrderValue)}`}>
                  {getGrowthIcon(comparison.growth.avgOrderValue)}
                  <span className="text-sm">{Math.abs(comparison.growth.avgOrderValue).toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold mb-2 text-gray-900">{formatPrice(comparison.current.avgOrderValue)}</p>
              <p className="text-xs text-gray-500">vs {formatPrice(comparison.previous.avgOrderValue)} last period</p>
            </div>
          </div>

          {/* Customers Card */}
          {customerStats && (
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-100 p-6 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="text-white" size={28} />
                  </div>
                  <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                    {customerStats.repeatRate.toFixed(0)}% REPEAT
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Customers</p>
                <p className="text-3xl font-bold mb-2 text-gray-900">{formatNumber(customerStats.totalCustomers)}</p>
                <p className="text-xs text-gray-500">{customerStats.newCustomers} new customers</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Trend Chart - Enhanced */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Revenue Trend</h2>
            <p className="text-sm text-gray-500">Daily revenue over selected period</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <span className="text-sm font-medium">Revenue</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#000000" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution - Enhanced */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Order Status</h2>
            <p className="text-sm text-gray-500">Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS.primary} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Hour - Enhanced */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Hourly Revenue</h2>
            <p className="text-sm text-gray-500">Today's revenue by hour</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour" 
                stroke="#666" 
                style={{ fontSize: '12px' }}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#000000" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Performance - Enhanced */}
      {categoryData && categoryData.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Category Performance</h2>
            <p className="text-sm text-gray-500">Revenue by product category</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(300, categoryData.length * 60)}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={180}
                style={{ fontSize: '13px', fontWeight: '500' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#000000" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Selling Products - Enhanced */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Top Selling Products</h2>
            <p className="text-sm text-gray-500">Best performers in this period</p>
          </div>
          <Award className="text-yellow-500" size={32} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 ? (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
                          ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : ''}
                          ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
                        `}>
                          #{index + 1}
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-black transition-colors">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-lg font-bold text-gray-900">
                        {formatNumber(product.quantity)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(product.revenue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Insights - Enhanced */}
      {customerStats && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Customer Insights</h2>
              <p className="text-sm text-gray-600">Understanding your customer base</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-gray-600 text-sm mb-2 font-medium">Total Customers</p>
              <p className="text-4xl font-bold text-indigo-600">{formatNumber(customerStats.totalCustomers)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-gray-600 text-sm mb-2 font-medium">New Customers</p>
              <p className="text-4xl font-bold text-green-600">{formatNumber(customerStats.newCustomers)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-gray-600 text-sm mb-2 font-medium">Returning</p>
              <p className="text-4xl font-bold text-blue-600">{formatNumber(customerStats.repeatingCustomers)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-gray-600 text-sm mb-2 font-medium">Repeat Rate</p>
              <p className="text-4xl font-bold text-purple-600">{customerStats.repeatRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;