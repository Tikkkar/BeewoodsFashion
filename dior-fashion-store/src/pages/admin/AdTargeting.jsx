import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Target, Users, Heart, Briefcase, Sparkles, AlertCircle, FileText,
  UploadCloud, X, Loader, Download, BrainCircuit, Clapperboard, Lightbulb, XCircle,
} from 'lucide-react';
import { generateAdTargeting } from '../../services/geminiAdTargetingService.ts';

const AdTargeting = () => {
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      setImage({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      });
      setError(null);
      setResult(null);
    } else {
      setError("File không hợp lệ. Vui lòng chọn ảnh dưới 5MB.");
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    setImage(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Vui lòng upload 1 ảnh sản phẩm');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(image.file);
      const request = {
        imageData: base64,
        productName: image.name.split('.').slice(0, -1).join('.') // Lấy tên file không bao gồm extension
      };
      const targetingResult = await generateAdTargeting(request);
      setResult(targetingResult);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi phân tích. Vui lòng thử lại!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-targeting-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TagList = ({ items, colorClass = "bg-gray-100 text-gray-700" }) => {
    if (!items || items.length === 0) {
      return <span className="text-sm text-gray-400 italic">Không có</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${colorClass}`}>
            {item}
          </span>
        ))}
      </div>
    );
  };
  
  TagList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string),
    colorClass: PropTypes.string,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Target className="w-8 h-8" />
          Phân Tích Target Facebook Ads (v4)
        </h1>
        <p className="text-indigo-100 text-lg">
          AI phân tích ảnh sản phẩm, đề xuất 3 nhóm đối tượng chi tiết và sâu sắc.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          1. Upload Ảnh Sản Phẩm (1 ảnh)
        </h3>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <UploadCloud className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-1 font-medium">Kéo thả ảnh hoặc click để chọn</p>
            <p className="text-sm text-gray-500">Chỉ 1 ảnh, tối đa 5MB</p>
          </label>
        </div>

        {image && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative inline-block group shrink-0">
                  <img src={image.preview} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-md" />
                  <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-red-600/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 font-medium break-all">Đã chọn: {image.name}</p>
              </div>
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base font-medium shrink-0">
                {isAnalyzing ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Đang phân tích...</>
                ) : (
                  <><Target className="w-5 h-5" /> Phân Tích Target</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md">
          <p className="font-bold">Đã xảy ra lỗi</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-lg p-4 shadow-md flex justify-between items-center">
            <div className="flex items-center gap-2 text-green-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Phân tích hoàn tất!</span>
            </div>
            <button onClick={handleExport} className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Xuất JSON
            </button>
          </div>

          {/* Product Analysis */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold flex items-center gap-3 mb-3 text-gray-800">
              <FileText className="w-6 h-6 text-indigo-600" /> Phân Tích Sản Phẩm
            </h3>
            <p className="text-gray-700 leading-relaxed italic">"{result.productAnalysis}"</p>
          </div>
          
          {result.targetingOptions.map((option, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg border-l-4 border-indigo-500 overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-indigo-700 mb-2">{option.optionName}</h3>
                <p className="text-gray-600 italic mb-6">{option.summary}</p>
                
                {/* --- MỤC MỚI: TÂM LÝ HỌC --- */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><BrainCircuit className="w-5 h-5 text-teal-500" /> Tâm Lý Học & Nỗi Đau</h4>
                <div className="space-y-3 mb-6 text-sm bg-teal-50/50 p-4 rounded-lg border border-teal-100">
                  <div>
                    <p className="font-medium text-teal-800 mb-1">Nỗi đau (Pain Points):</p>
                    <TagList items={option.psychographics.painPoints} colorClass="bg-red-100 text-red-800" />
                  </div>
                  <div>
                    <p className="font-medium text-teal-800 mb-1">Mục tiêu (Goals):</p>
                    <TagList items={option.psychographics.goals} colorClass="bg-green-100 text-green-800" />
                  </div>
                  <div>
                    <p className="font-medium text-teal-800 mb-1">Động lực (Motivations):</p>
                    <TagList items={option.psychographics.motivations} colorClass="bg-blue-100 text-blue-800" />
                  </div>
                </div>

                {/* Demographics */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><Users className="w-5 h-5 text-blue-500" /> Nhân Khẩu Học</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                  <div><p className="font-medium text-gray-600 mb-1">Độ tuổi:</p><TagList items={option.demographics.ageRange} colorClass="bg-blue-100 text-blue-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Giới tính:</p><TagList items={option.demographics.gender} colorClass="bg-pink-100 text-pink-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Địa điểm:</p><TagList items={option.demographics.location} colorClass="bg-green-100 text-green-700" /></div>
                </div>

                {/* Job Details */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><Briefcase className="w-5 h-5 text-yellow-600" /> Nghề Nghiệp</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                  <div><p className="font-medium text-gray-600 mb-1">Công việc cụ thể:</p><TagList items={option.jobDetails.specificJobs} colorClass="bg-yellow-100 text-yellow-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Hành vi liên quan:</p><TagList items={option.jobDetails.jobRelatedBehaviors} colorClass="bg-yellow-100 text-yellow-700" /></div>
                </div>

                {/* Lifestyle & Interests */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><Heart className="w-5 h-5 text-red-500" /> Sở Thích & Phong Cách Sống</h4>
                <div className="space-y-3 mb-6 text-sm">
                  <div><p className="font-medium text-gray-600 mb-1">Sở thích liên quan:</p><TagList items={option.lifestyleAndInterests.relevantInterests} colorClass="bg-red-100 text-red-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Nơi thường đến:</p><TagList items={option.lifestyleAndInterests.placesTheyGo} colorClass="bg-purple-100 text-purple-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Công cụ thường dùng:</p><TagList items={option.lifestyleAndInterests.toolsTheyUse} colorClass="bg-gray-200 text-gray-800" /></div>
                </div>

                {/* --- MỤC MỚI: MEDIA CONSUMPTION --- */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><Clapperboard className="w-5 h-5 text-orange-500" /> Thói Quen Tiêu Thụ Nội Dung</h4>
                <div className="space-y-3 mb-6 text-sm">
                  <div><p className="font-medium text-gray-600 mb-1">Influencers/Creators:</p><TagList items={option.mediaConsumption.influencersOrCreators} colorClass="bg-orange-100 text-orange-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Báo chí/Blogs:</p><TagList items={option.mediaConsumption.publicationsOrBlogs} colorClass="bg-orange-100 text-orange-700" /></div>
                  <div><p className="font-medium text-gray-600 mb-1">Nền tảng MXH ưa thích:</p><TagList items={option.mediaConsumption.preferredSocialPlatforms} colorClass="bg-orange-100 text-orange-700" /></div>
                </div>
                
                {/* --- MỤC MỚI: CREATIVE ANGLE --- */}
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700 mt-6"><Lightbulb className="w-5 h-5 text-amber-500" /> Gợi Ý Sáng Tạo & Tiếp Cận</h4>
                <div className="space-y-4 mb-6 text-sm bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                    <div>
                        <p className="font-semibold text-amber-800 mb-2">Thông điệp chính:</p>
                        <blockquote className="border-l-4 border-amber-400 pl-4 text-gray-700 italic text-base">
                          {option.creativeAngle.mainMessage}
                        </blockquote>
                    </div>
                     <div>
                        <p className="font-semibold text-amber-800 mb-2">Gợi ý câu "Hook" thu hút:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {option.creativeAngle.suggestedHooks.map((hook, hIndex) => <li key={hIndex}>{hook}</li>)}
                        </ul>
                    </div>
                </div>
                
                {/* Facebook Targeting */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-6">
                  <h4 className="text-lg font-semibold flex items-center gap-2 mb-3 text-indigo-800"><Target className="w-5 h-5" /> Gợi Ý Target Facebook Ads</h4>
                  <div className="space-y-4 text-sm">
                    <div><p className="font-semibold text-indigo-700 mb-1">Sở thích (Detailed Targeting):</p><TagList items={option.facebookTargeting.detailedInterests} colorClass="bg-indigo-200/80 text-indigo-800" /></div>
                    <div><p className="font-semibold text-indigo-700 mb-1">Hành vi (Behaviors):</p><TagList items={option.facebookTargeting.detailedBehaviors} colorClass="bg-indigo-200/80 text-indigo-800" /></div>
                    <div><p className="font-semibold text-indigo-700 mb-1">Nhân khẩu học (Demographics):</p><TagList items={option.facebookTargeting.detailedDemographics} colorClass="bg-indigo-200/80 text-indigo-800" /></div>
                    {/* --- MỤC MỚI: EXCLUSIONS --- */}
                    <hr className="border-indigo-200"/>
                    <div>
                      <p className="font-semibold text-red-700 mb-1 flex items-center gap-1.5"><XCircle size={16}/> Loại trừ (Exclusions):</p>
                      <TagList items={option.facebookTargeting.exclusions} colorClass="bg-slate-200 text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!result && !isAnalyzing && (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300 mt-6">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Chưa có kết quả phân tích
          </h3>
          <p className="text-gray-500">
            Upload ảnh sản phẩm để AI bắt đầu phân tích nhé!
          </p>
        </div>
      )}
    </div>
  );
};

export default AdTargeting;