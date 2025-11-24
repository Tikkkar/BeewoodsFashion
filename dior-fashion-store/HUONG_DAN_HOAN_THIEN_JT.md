# HƯỚNG DẪN HOÀN THIỆN J&T INTEGRATION

## ✅ Task A: AdminProductForm - ĐÃ HOÀN THÀNH

File `src/pages/admin/AdminProductForm.jsx` đã có đầy đủ:
- ✅ State fields: `weight_g`, `length_cm`, `width_cm`, `height_cm`
- ✅ UI inputs tại dòng 477-530
- ✅ Submit logic đã gửi dữ liệu này

**KHÔNG CẦN SỬA GÌ THÊM**

---

## ⚠️ Task B: AdminOrderDetail - CẦN BỔ SUNG

### Bước 1: Sửa API (admin.js)

**File:** `src/lib/api/admin.js`
**Dòng 268:** Tìm dòng này:
```javascript
"*, users(*), order_items(*, products(name,product_images(image_url)))"
```

**Thay thế bằng:**
```javascript
"*, users(*), order_items(*, products(name,product_images(image_url))), shipments(*)"
```

### Bước 2: Thêm UI hiển thị Shipment

**File:** `src/pages/admin/AdminOrderDetail.jsx`

**Tìm dòng ~410** (sau phần hiển thị thông tin khách hàng), thêm đoạn code sau:

```jsx
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
```

---

## ⚠️ Task C: Nút "Xác nhận đơn hàng" - CẦN BỔ SUNG

**File:** `src/pages/admin/AdminOrderDetail.jsx`

**Tìm phần dropdown chọn status** (khoảng dòng 200-250), thêm nút này **TRƯỚC** dropdown:

```jsx
{order.status === 'pending' && (
  <button
    onClick={async () => {
      if (window.confirm('Xác nhận đơn hàng và tạo vận đơn J&T?')) {
        setUpdating(true);
        try {
          await updateOrderStatus(order.id, 'processing');
          await loadOrder(); // Reload để hiện shipment
          toast.success('Đã xác nhận đơn hàng và tạo vận đơn!');
        } catch (error) {
          toast.error('Lỗi: ' + error.message);
        } finally {
          setUpdating(false);
        }
      }
    }}
    disabled={updating}
    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
  >
    <CheckCircle className="w-5 h-5" />
    {updating ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
  </button>
)}
```

---

## 📝 Tóm tắt các thay đổi cần làm

1. **admin.js (dòng 268)**: Thêm `, shipments(*)` vào select query
2. **AdminOrderDetail.jsx (~dòng 410)**: Thêm section hiển thị shipment info
3. **AdminOrderDetail.jsx (~dòng 200-250)**: Thêm nút "Xác nhận đơn hàng"

---

## ✅ Sau khi sửa xong, test như sau:

1. Vào Admin → Orders → Click vào 1 đơn hàng
2. Nếu status = "pending", sẽ thấy nút "Xác nhận đơn hàng"
3. Click nút → Đơn chuyển sang "processing"
4. Reload trang → Sẽ thấy section "Thông tin Vận chuyển (J&T)" hiện ra
5. Kiểm tra Supabase table `shipments` → Sẽ có 1 record mới được tạo tự động

---

## 🔧 Import cần thiết

Đảm bảo `AdminOrderDetail.jsx` đã import:
```javascript
import { Truck, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
```

Nếu chưa có, thêm vào đầu file.
