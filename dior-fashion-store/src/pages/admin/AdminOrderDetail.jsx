import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAdminOrderDetails, updateOrderStatus } from "../../lib/api/admin";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Mail,
  CreditCard,
  Phone,
  Bell,
} from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(price) || 0
  );

const statusMeta = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-50 text-yellow-700",
    icon: Package,
  },
  processing: {
    label: "Đang chuẩn bị",
    color: "bg-blue-50 text-blue-700",
    icon: Package,
  },
  shipping: {
    label: "Đang giao hàng",
    color: "bg-purple-50 text-purple-700",
    icon: Truck,
  },
  completed: {
    label: "Đã giao thành công",
    color: "bg-green-50 text-green-700",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700",
    icon: XCircle,
  },
};

const ORDER_STATUSES = Object.keys(statusMeta);

const AdminOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [znsStatus, setZnsStatus] = useState(null);

  const loadOrder = async () => {
    setLoading(true);
    const { data, error } = await getAdminOrderDetails(id);
    if (error) {
      console.error("❌ Error loading order:", error);
    }
    setOrder(data || null);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // ✅ SIMPLIFIED: Just call Edge Function, let it handle everything
  const sendZNSNotification = async (order, newStatus) => {
    try {
      console.log("📤 Sending ZNS for status change:", {
        order_number: order.order_number,
        new_status: newStatus,
      });

      // Prepare ZNS payload - Edge Function will check consent internally
      const znsPayload = {
        action: "SEND_ORDER_ZNS",
        payload: {
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          zalo_user_id: order.customer_phone.replace(/^0/, "84"), // Use phone as fallback
          order_date: new Date(order.created_at).toLocaleDateString("vi-VN"),
          order_status: statusMeta[newStatus]?.label || "Đang xử lý",
        },
      };

      console.log("📤 ZNS Payload:", znsPayload);

      // Call Edge Function
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL}/functions/v1/chatbot-process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(znsPayload),
        }
      );

      const result = await response.json();
      console.log("📥 ZNS Response:", result);

      if (result.success) {
        console.log("✅ ZNS sent successfully");
        return { sent: true, result };
      } else {
        // Check if it's a "no consent" error
        if (
          result.error?.includes("No Zalo User ID") ||
          result.error?.includes("no consent")
        ) {
          console.log("⚠️ Customer hasn't consented");
          return { sent: false, reason: "no_consent" };
        }
        console.error("❌ Failed to send ZNS:", result.error);
        return { sent: false, error: result.error };
      }
    } catch (error) {
      console.error("❌ Error sending ZNS:", error);
      return { sent: false, error: error.message };
    }
  };

  const handleStatusUpdate = async (e) => {
    const newStatus = e.target.value;

    if (updating) return;

    setUpdating(true);
    setZnsStatus("sending");

    try {
      // 1. Update order status
      await updateOrderStatus(id, newStatus);

      // 2. Send ZNS notification
      const znsResult = await sendZNSNotification(order, newStatus);

      if (znsResult.sent) {
        setZnsStatus("success");
        setTimeout(() => setZnsStatus(null), 3000);
      } else if (znsResult.reason === "no_consent") {
        setZnsStatus("skipped");
        setTimeout(() => setZnsStatus(null), 4000);
      } else {
        setZnsStatus("error");
        setTimeout(() => setZnsStatus(null), 3000);
      }

      // 3. Reload order
      await loadOrder();
    } catch (error) {
      console.error("Error updating order:", error);
      setZnsStatus("error");
      setTimeout(() => setZnsStatus(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-12 text-gray-700 text-xl">
        Không tìm thấy đơn hàng
      </div>
    );

  const meta = statusMeta[order.status] || statusMeta.pending;
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ZNS Status Notification */}
      {znsStatus && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 animate-slide-in ${znsStatus === "success"
            ? "bg-green-50 border-green-500 text-green-800"
            : znsStatus === "sending"
              ? "bg-blue-50 border-blue-500 text-blue-800"
              : znsStatus === "skipped"
                ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                : "bg-red-50 border-red-500 text-red-800"
            }`}
        >
          <div className="flex items-center gap-3">
            {znsStatus === "sending" && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang gửi thông báo Zalo...</span>
              </>
            )}
            {znsStatus === "success" && (
              <>
                <Bell className="w-5 h-5" />
                <span>✅ Đã gửi thông báo Zalo cho khách hàng!</span>
              </>
            )}
            {znsStatus === "skipped" && (
              <>
                <Bell className="w-5 h-5" />
                <div>
                  <div className="font-medium">
                    ⚠️ Chưa gửi được thông báo Zalo
                  </div>
                  <div className="text-xs mt-1">
                    Khách hàng chưa đăng ký nhận thông báo từ trang thanh toán
                  </div>
                </div>
              </>
            )}
            {znsStatus === "error" && (
              <>
                <XCircle className="w-5 h-5" />
                <span>❌ Không thể gửi thông báo Zalo</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <Link
          to="/admin/orders"
          className="text-md text-blue-600 hover:underline"
        >
          &larr; Quay lại danh sách đơn
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-2xl font-bold">
            Đơn {order.order_number}
          </span>
          <span
            className={`px-4 py-1 rounded-lg border inline-flex items-center gap-2 ${meta.color} font-semibold`}
          >
            <StatusIcon size={18} />
            {meta.label}
          </span>
          {order.status === 'pending' && (
            <button
              onClick={async () => {
                if (window.confirm('Xác nhận đơn hàng và tạo vận đơn J&T?')) {
                  setUpdating(true);
                  try {
                    await updateOrderStatus(order.id, 'processing');
                    await loadOrder(); // Reload để hiện shipment
                  } catch (error) {
                    // Error already handled by updateOrderStatus
                  } finally {
                    setUpdating(false);
                  }
                }
              }}
              disabled={updating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {updating ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
            </button>
          )}
          <select
            value={order.status}
            onChange={handleStatusUpdate}
            disabled={updating}
            className={`ml-3 border text-sm p-2 rounded-lg bg-white shadow-sm ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusMeta[s].label}
              </option>
            ))}
          </select>
          {updating && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          )}
        </div>
      </div>

      {/* Timeline Status */}
      <div className="flex gap-10 items-center justify-center my-3">
        {ORDER_STATUSES.map((st, idx) => (
          <div key={st} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === st
                ? statusMeta[st].color
                : "bg-gray-200 text-gray-500"
                }`}
            >
              {React.createElement(statusMeta[st].icon, { size: 24 })}
            </div>
            <div
              className={`mt-1 text-xs font-medium ${order.status === st ? "text-black" : "text-gray-400"
                }`}
            >
              {statusMeta[st].label}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:flex w-full justify-center -mt-8 mb-8">
        <div className="h-1 bg-gray-200 w-full max-w-xl -ml-20 -mr-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Sản phẩm đã đặt</h2>
          <ul className="divide-y divide-gray-200">
            {order.order_items.map((item) => (
              <li key={item.id} className="py-3 flex gap-4 items-center">
                <img
                  src={
                    item.product_image ||
                    item.products?.product_images?.[0]?.image_url ||
                    "/placeholder.png"
                  }
                  alt={item.product_name || item.products?.name}
                  className="w-14 h-14 rounded-md object-cover border"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.product_name || item.products?.name}</p>
                  <p className="text-xs text-gray-500">
                    SL: {item.quantity} | Size: {item.size}
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="pt-4 mt-4 border-t border-gray-200 text-right space-y-1 text-lg">
            <div>
              Tạm tính:{" "}
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div>
                Giảm giá:{" "}
                <span className="font-medium text-green-600">
                  - {formatPrice(order.discount_amount)}
                </span>
              </div>
            )}
            <div>
              Phí vận chuyển:{" "}
              <span className="font-medium">
                {formatPrice(order.shipping_fee)}
              </span>
            </div>
            <div className="text-xl font-bold mt-2">
              Tổng cộng:{" "}
              <span className="text-red-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info & Address */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User size={22} /> Thông tin khách hàng
            </h2>
            <p className="font-semibold">{order.customer_name}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Mail size={16} />
              {order.customer_email || "Chưa có email"}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Phone size={16} />
              {order.customer_phone}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin size={22} /> Địa chỉ giao hàng
            </h2>
            <p className="text-sm text-gray-700">
              {order.shipping_address}, {order.shipping_ward},{" "}
              {order.shipping_district}, {order.shipping_city}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard size={22} /> Thanh toán
            </h2>
            <p className="flex items-center gap-2">
              Phương thức:{" "}
              <span className="font-semibold">
                {order.payment_method === "cod"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : order.payment_method}
              </span>
            </p>
            <p className="flex items-center gap-2">
              Trạng thái:{" "}
              <span
                className={
                  order.payment_status === "paid"
                    ? "text-green-600 font-semibold"
                    : "text-yellow-600 font-semibold"
                }
              >
                {order.payment_status === "paid"
                  ? "Đã thanh toán"
                  : "Chưa thanh toán"}
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* Thông tin vận chuyển J&T */}
      {order.shipments && order.shipments.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Thông tin Vận chuyển (J&T)
          </h2>
          {order.shipments.map((shipment) => (
            <div key={shipment.id} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mã vận đơn</p>
                  <p className="font-medium">{shipment.tracking_number || "Chưa có"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="font-medium capitalize">{shipment.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiền thu hộ (COD)</p>
                  <p className="font-medium">{formatPrice(shipment.cod_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trọng lượng</p>
                  <p className="font-medium">{(shipment.total_weight_g / 1000).toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nhà vận chuyển</p>
                  <p className="font-medium">{shipment.carrier_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phí vận chuyển</p>
                  <p className="font-medium">{formatPrice(shipment.shipping_fee_actual || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        order.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              💡 Đơn hàng chưa được đẩy sang vận chuyển. Chuyển trạng thái sang "Đang chuẩn bị" để tạo vận đơn tự động.
            </p>
          </div>
        )
      )}
      {/* Shipment Info */}
      {order.shipments && order.shipments.length > 0 && (
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow border border-gray-100 mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Truck size={22} /> Thông tin vận chuyển (J&T Express)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Mã vận đơn</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">COD</th>
                  <th className="px-4 py-3">Phí ship</th>
                  <th className="px-4 py-3">Cân nặng</th>
                </tr>
              </thead>
              <tbody>
                {order.shipments.map((shipment) => (
                  <tr key={shipment.id} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {shipment.tracking_number || "Đang tạo..."}
                    </td>
                    <td className="px-4 py-3">{shipment.carrier_code}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatPrice(shipment.cod_amount)}</td>
                    <td className="px-4 py-3">{formatPrice(shipment.shipping_fee_actual)}</td>
                    <td className="px-4 py-3">{shipment.total_weight_g}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

  );
};

export default AdminOrderDetail;
