import React from "react";

/**
 * SEOContentRenderer
 * Props:
 * - contentBlocks: array of blocks returned by AI (type: text|image)
 * - fallbackDescription: string, shown if no blocks
 * - productImages: array of image URLs from DB to use as fallback
 */
const isPlaceholder = (u) =>
  !u || typeof u !== "string" || u.trim() === "" || /^(exam|placeholder|null|undefined)$/i.test(u.trim());

const SEOContentRenderer = ({ contentBlocks = [], fallbackDescription, productImages = [] }) => {
  const hasBlocks = Array.isArray(contentBlocks) && contentBlocks.length > 0;
  const firstProductImage = (productImages || []).find((u) => !isPlaceholder(u));

  if (!hasBlocks) {
    return (
      <div className="space-y-4">
        {firstProductImage && (
          <img
            src={firstProductImage}
            alt="Ảnh sản phẩm"
            className="w-full rounded-lg shadow-md mb-3 object-cover"
            loading="lazy"
          />
        )}
        <p className="text-gray-700 leading-relaxed">
          {fallbackDescription || "Đang cập nhật thông tin sản phẩm..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contentBlocks.map((block, idx) => {
        const type = block.type || block.kind || "text";
        const title = block.title || block.heading || "";
        const content = block.content || block.html || "";
        const url = (block.url || block.image || block.src || "").trim();
        const alt = block.alt || block.alt_text || `Ảnh sản phẩm ${idx + 1}`;
        const caption = block.caption || block.note || "";

        // If the AI returned a placeholder or invalid url, fallback to productImages
        const imageUrl = !isPlaceholder(url) ? url : firstProductImage;

        return (
          <section key={block.id || idx} className="prose max-w-none">
            {type === "text" && (
              <div>
                {title && <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>}
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}

            {type === "image" && (
              <figure className="my-6">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={alt}
                    className="w-full rounded-lg shadow-md"
                    loading="lazy"
                  />
                ) : null}
                {caption && (
                  <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                    {caption}
                  </figcaption>
                )}
              </figure>
            )}

            {type !== "text" && type !== "image" && (imageUrl || content) && (
              <div>
                {imageUrl && (
                  <img src={imageUrl} alt={alt} className="w-full rounded-lg shadow-md" loading="lazy" />
                )}
                {content && (
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default SEOContentRenderer;
