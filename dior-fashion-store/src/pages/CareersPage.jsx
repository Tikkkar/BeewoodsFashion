import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Award,
  Heart,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const CareersPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    cover_letter: "",
    resume: null,
  });

  // Mock data - trong thực tế sẽ lấy từ Supabase
  const mockJobs = [
    {
      id: 1,
      title: "Senior Fashion Designer",
      department: "Design",
      location: "Hanoi, Vietnam",
      type: "Full-time",
      salary: "Competitive",
      description:
        "We're looking for a creative Senior Fashion Designer to join our luxury fashion team.",
      requirements: [
        "5+ years experience in luxury fashion design",
        "Strong portfolio showcasing luxury collections",
        "Expertise in fabric selection and pattern making",
        "Bachelor's degree in Fashion Design",
        "Leadership and team management skills",
      ],
      benefits: [
        "Competitive salary + performance bonuses",
        "Health insurance & wellness programs",
        "Employee discount on BEWO products",
        "Professional development opportunities",
        "Creative work environment",
      ],
      posted_date: "2024-03-15",
      is_active: true,
    },
    {
      id: 2,
      title: "E-commerce Manager",
      department: "E-commerce",
      location: "Ho Chi Minh City, Vietnam",
      type: "Full-time",
      salary: "Negotiable",
      description:
        "Lead our e-commerce operations and drive online sales growth.",
      requirements: [
        "3+ years in e-commerce management",
        "Experience with luxury fashion e-commerce",
        "Strong analytical and marketing skills",
        "Knowledge of SEO and digital marketing",
        "Bachelor's degree in Business or Marketing",
      ],
      benefits: [
        "Performance-based bonuses",
        "Flexible working hours",
        "Career growth opportunities",
        "Modern office environment",
        "Team building activities",
      ],
      posted_date: "2024-03-10",
      is_active: true,
    },
    {
      id: 3,
      title: "Customer Experience Specialist",
      department: "Customer Service",
      location: "Remote",
      type: "Full-time",
      salary: "Attractive Package",
      description:
        "Provide exceptional customer service for our luxury clientele.",
      requirements: [
        "2+ years in customer service",
        "Excellent communication skills",
        "Passion for luxury fashion",
        "Multilingual skills preferred",
        "Problem-solving mindset",
      ],
      benefits: [
        "Work from home flexibility",
        "Commission on sales",
        "Product training programs",
        "Career advancement path",
        "Supportive team culture",
      ],
      posted_date: "2024-03-12",
      is_active: true,
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // Trong thực tế: await supabase.from('careers').select('*').eq('is_active', true)
        setTimeout(() => {
          setJobs(mockJobs);
          setLoading(false);
        }, 1000);
      } catch (err) {
        error("Failed to load job openings");
        setLoading(false);
      }
    };

    fetchJobs();
  }, [error]);

  const handleApply = (job) => {
    setSelectedJob(job);
    setApplicationForm((prev) => ({
      ...prev,
      position: job.title,
      full_name: user?.user_metadata?.full_name || "",
      email: user?.email || "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setApplicationForm((prev) => ({
      ...prev,
      resume: e.target.files[0],
    }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!applicationForm.resume) {
      error("Please upload your resume");
      return;
    }

    try {
      // Simulate API call
      // Trong thực tế: await supabase.from('job_applications').insert({...})
      setTimeout(() => {
        success(
          "Application submitted successfully! We will contact you soon."
        );
        setSelectedJob(null);
        setApplicationForm({
          full_name: "",
          email: "",
          phone: "",
          position: "",
          cover_letter: "",
          resume: null,
        });
      }, 1500);
    } catch (err) {
      error("Failed to submit application. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-16"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-6 tracking-wide">
              Join Our Team
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Be part of the luxury fashion revolution. Create exceptional
              experiences and shape the future of BEWO Store.
            </p>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Why BEWO Store?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We believe in nurturing talent and creating an environment where
              creativity thrives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Award className="h-8 w-8" />,
                title: "Career Growth",
                description:
                  "Continuous learning opportunities and clear career progression paths",
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Inclusive Culture",
                description:
                  "Diverse and supportive environment that values every team member",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Great Team",
                description:
                  "Collaborate with passionate professionals in the fashion industry",
              },
            ].map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Current Openings
            </h2>
            <p className="text-gray-600">
              Find your perfect role and apply today
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {job.department}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{job.description}</p>
                  </div>
                  <button
                    onClick={() => handleApply(job)}
                    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors duration-200 flex items-center"
                  >
                    Apply Now <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light">
                  Apply for {selectedJob.title}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={applicationForm.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={applicationForm.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationForm.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume/CV *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max: 5MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter
                  </label>
                  <textarea
                    name="cover_letter"
                    value={applicationForm.cover_letter}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors duration-200"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
