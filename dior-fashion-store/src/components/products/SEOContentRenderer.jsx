import React from "react";

const SEOContentRenderer = ({ contentBlocks, fallbackDescription }) => {
  // Kiểm tra có content blocks không
  const hasContentBlocks =
    contentBlocks && Array.isArray(contentBlocks) && contentBlocks.length > 0;

  if (!hasContentBlocks) {
    // Fallback: Hiển thị mô tả thường
    return (
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          {fallbackDescription || "Đang cập nhật thông tin sản phẩm..."}
        </p>
      </div>
    );
  }

  // Render content blocks
  return (
    <div className="space-y-6">
      {contentBlocks.map((block, index) => (
        <div key={block.id || index}>
          {block.type === "text" ? (
            <div>
              {block.title && (
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {block.title}
                </h3>
              )}
              <div
                className="text-gray-700 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          ) : block.type === "image" ? (
            <figure className="my-6">
              {block.url && (
                <img
                  src={block.url}
                  alt={block.alt || "Product image"}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
              )}
              {block.caption && (
                <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default SEOContentRenderer;
