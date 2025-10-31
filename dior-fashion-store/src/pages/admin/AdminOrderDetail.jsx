import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAdminOrderDetails, updateOrderStatus } from "../../lib/api/admin";
import { createClient } from "@supabase/supabase-js";
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

// Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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
  const [znsStatus, setZnsStatus] = useState(null); // For ZNS notification status

  const loadOrder = async () => {
    setLoading(true);
    const { data } = await getAdminOrderDetails(id);
    setOrder(data || null);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // ✅ NEW: Send ZNS notification
  const sendZNSNotification = async (order, newStatus) => {
    try {
      console.log("📤 Sending ZNS for status change:", {
        order_number: order.order_number,
        old_status: order.status,
        new_status: newStatus,
      });

      // Get customer Zalo info
      const { data: customerProfile, error: profileError } = await supabase
        .from("customer_profiles")
        .select("zalo_user_id, zalo_consent_active, full_name")
        .eq("phone", order.customer_phone)
        .single();

      if (profileError) {
        console.log("⚠️ No customer profile found");
        return { sent: false, reason: "no_profile" };
      }

      if (
        !customerProfile?.zalo_consent_active ||
        !customerProfile?.zalo_user_id
      ) {
        console.log("⚠️ Customer has not consented to Zalo notifications");
        return { sent: false, reason: "no_consent" };
      }

      // Prepare ZNS payload
      const znsPayload = {
        action: "SEND_ORDER_ZNS",
        payload: {
          order_number: order.order_number,
          customer_name: order.customer_name || customerProfile.full_name,
          customer_phone: order.customer_phone,
          zalo_user_id: customerProfile.zalo_user_id,
          order_date: new Date(order.created_at).toLocaleDateString("vi-VN"),
          order_status: statusMeta[newStatus]?.label || "Đang xử lý",
        },
      };

      console.log("📤 ZNS Payload:", znsPayload);

      // Call Edge Function
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/chatbot-process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
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
        console.error("❌ Failed to send ZNS:", result.error);
        return { sent: false, error: result.error };
      }
    } catch (error) {
      console.error("❌ Error sending ZNS:", error);
      return { sent: false, error: error.message };
    }
  };

  // ✅ UPDATED: Handle status update with ZNS
  const handleStatusUpdate = async (e) => {
    const newStatus = e.target.value;

    if (updating) return; // Prevent double-click

    setUpdating(true);
    setZnsStatus("sending"); // Show loading state

    try {
      // 1. Update order status
      await updateOrderStatus(id, newStatus);

      // 2. Send ZNS notification
      const znsResult = await sendZNSNotification(order, newStatus);

      if (znsResult.sent) {
        setZnsStatus("success");
        setTimeout(() => setZnsStatus(null), 3000); // Clear after 3s
      } else {
        setZnsStatus("skipped");
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
      {/* ✅ ZNS Status Notification */}
      {znsStatus && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
            znsStatus === "success"
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
                <span>⚠️ Khách hàng chưa đăng ký nhận thông báo Zalo</span>
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

      {/* Header - Back link + Order Number + Status */}
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
          <select
            value={order.status}
            onChange={handleStatusUpdate}
            disabled={updating}
            className={`ml-3 border text-sm p-2 rounded-lg bg-white shadow-sm ${
              updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                order.status === st
                  ? statusMeta[st].color
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {React.createElement(statusMeta[st].icon, { size: 24 })}
            </div>
            <div
              className={`mt-1 text-xs font-medium ${
                order.status === st ? "text-black" : "text-gray-400"
              }`}
            >
              {statusMeta[st].label}
            </div>
            {idx < ORDER_STATUSES.length - 1 && (
              <div className="hidden w-10 h-1 mx-1 bg-gray-200 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Timeline connector */}
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
                    item.products?.product_images?.[0]?.image_url ||
                    "/placeholder.png"
                  }
                  alt={item.products?.name}
                  className="w-14 h-14 rounded-md object-cover border"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.products?.name}</p>
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
    </div>
  );
};

export default AdminOrderDetail;
