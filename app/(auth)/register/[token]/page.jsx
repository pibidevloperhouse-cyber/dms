"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
} from "react-icons/fa";
import { FiShield } from "react-icons/fi";

export default function TokenRegisterPage() {
    const params = useParams();
    const token = params.token;
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [errorState, setErrorState] = useState(null);
    const [mobileError, setMobileError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [isExistingUser, setIsExistingUser] = useState(false);
    const [sessionUser, setSessionUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Invitation Details Storage
    const [invitationDetails, setInvitationDetails] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // 1. Fetch Invitation Details on Load
    useEffect(() => {
        const checkInvitation = async () => {
            if (!token) return;

            setLoadingInvite(true);
            try {
                const res = await fetch(`/api/invite/verify?token=${token}`);
                const data = await res.json();

                if (!res.ok || !data.success || !data.invitation) {
                    setErrorState(data.error || "Invalid Invitation");
                    return;
                }

                const invitation = data.invitation;

                if (invitation.status !== "pending") {
                    setErrorState("Invitation Already Used");
                    return;
                }

                setInvitationDetails(invitation);
                setFormData((prev) => ({
                    ...prev,
                    email: invitation.email,
                }));

                // Check session
                const sessionString = localStorage.getItem('vdr_session');
                let currentSessionUser = null;
                if (sessionString) {
                    try {
                        currentSessionUser = JSON.parse(sessionString);
                        setSessionUser(currentSessionUser);
                    } catch (e) {
                        console.error("Error parsing session", e);
                    }
                }

                // Check user exists if not logged in
                if (!currentSessionUser || currentSessionUser.email !== invitation.email) {
                    const res = await fetch(`/api/user/check?email=${encodeURIComponent(invitation.email)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setIsExistingUser(data.exists);
                    }
                }

            } catch (err) {
                console.error("Check invitation error:", err);
                setErrorState("An error occurred while verifying the invitation.");
            } finally {
                setLoadingInvite(false);
            }
        };

        checkInvitation();
    }, [token]);

    // Debounced Mobile Check
    useEffect(() => {
        const checkMobile = async () => {
            if (!formData.mobile) return;
            const { data } = await supabase
                .from("users")
                .select("id")
                .eq("phone_number", formData.mobile)
                .maybeSingle();

            if (data) {
                setMobileError("This mobile number already exists");
            } else {
                setMobileError("");
            }
        };

        const timeoutId = setTimeout(checkMobile, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.mobile]);

    // Password Match Check
    useEffect(() => {
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setPasswordError("Passwords do not match");
        } else {
            setPasswordError("");
        }
    }, [formData.password, formData.confirmPassword]);

    const handleAcceptExisting = async () => {
        setSubmitting(true);
        try {
            if (!sessionUser) throw new Error("You must be logged in to accept this invitation.");

            const targetRole = invitationDetails?.groups?.role || "external_user";

            const assignRes = await fetch("/api/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: sessionUser.id,
                    invitation_id: invitationDetails.id,
                    group_id: invitationDetails.group_id,
                    workspace_id: invitationDetails.groups?.workspace_id,
                    role: targetRole,
                    invited_by: invitationDetails.invited_by
                })
            });
            const assignData = await assignRes.json();
            if (!assignRes.ok) throw new Error(assignData.error || "Failed to assign workspace access");

            if (invitationDetails.requires_nda) {
                sessionUser.nda_status = "pending";
                localStorage.setItem('vdr_session', JSON.stringify(sessionUser));
                router.push("/sign-nda");
            } else {
                router.push("/workspace");
            }
        } catch (err) {
            console.error("Accept error:", err);
            alert("Failed to accept invitation. Please try again.");
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (value, index) => {
        const updatedOtp = [...otp];
        updatedOtp[index] = value;
        setOtp(updatedOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // 2. Perform database user registration and complete invitation status update
    // const handleFinalSubmit = async () => {
    //     if (formData.password !== formData.confirmPassword) {
    //         alert("Passwords do not match.");
    //         return;
    //     }

    //     try {
    //         // const targetRole = invitationDetails?.groups?.name || "external_user";
    //         // ✅ Check if group name matches a valid role enum
    //         const VALID_ROLES = ["admin", "sub_admin", "super_admin", "external_user"];
    //         const groupName = invitationDetails?.groups?.name || "";
    //         const normalizedName = groupName.trim().toLowerCase().replace(/\s+/g, "_");
    //         const targetRole = VALID_ROLES.includes(normalizedName) ? normalizedName : "external_user";


    //         // 💡 Company ID-ஐ எடுக்கிறோம் (Group லிருந்தோ அல்லது Invite செய்தவர் லிருந்தோ)
    //         const targetCompany =
    //             invitationDetails?.groups?.company_id ||
    //             invitationDetails?.inviter?.company_id ||
    //             "11111111-1111-1111-1111-111111111111"; // Fallback Company ID

    //         // Insert User
    //         const { data: newUser, error: userError } = await supabase
    //             .from("users")
    //             .insert({
    //                 name: formData.name,
    //                 email: formData.email,
    //                 phone_number: formData.mobile,
    //                 password_hash: formData.password,
    //                 role: targetRole,
    //                 company_id: targetCompany, // ✅ Company ID இங்கே சேர்க்கப்பட்டுள்ளது
    //                 status: "active",
    //             });

    //         if (userError) {
    //             throw new Error(userError.message);
    //         }

    //         // Update Invitation Status
    //         await supabase
    //             .from("invitations")
    //             .update({ status: "accepted" })
    //             .eq("id", invitationDetails.id);

    //         setStep(3); // Success Screen
    //     } catch (err) {
    //         console.error("Registration Error:", err);
    //         alert("Failed to complete registration: " + err.message);
    //     }
    // };


    // const handleFinalSubmit = async () => {
    //     if (formData.password !== formData.confirmPassword) {
    //         alert("Passwords do not match.");
    //         return;
    //     }

    //     try {
    //         // Check if group name is a system role
    //         const VALID_ROLES = ["admin", "sub_admin", "super_admin", "external_user"];
    //         const groupName = invitationDetails?.groups?.name || "";
    //         const normalizedName = groupName.trim().toLowerCase().replace(/\s+/g, "_");
    //         const isSystemGroup = VALID_ROLES.includes(normalizedName);

    //         // System group → use role. Custom group → external_user
    //         const targetRole = isSystemGroup ? normalizedName : "external_user";

    //         const targetCompany =
    //             invitationDetails?.groups?.company_id ||
    //             "11111111-1111-1111-1111-111111111111";

    //         // 1. Insert user
    //         const { data: newUser, error: userError } = await supabase
    //             .from("users")
    //             .insert({
    //                 name: formData.name,
    //                 email: invitationDetails.email,
    //                 phone_number: formData.mobile,
    //                 password_hash: formData.password,
    //                 role: targetRole,
    //                 company_id: targetCompany,
    //                 status: "active",
    //             })
    //             .select("id")
    //             .single();

    //         if (userError) throw new Error(userError.message);

    //         // 2. Custom group only → insert user_groups link
    //         if (!isSystemGroup) {
    //             const { error: ugError } = await supabase
    //                 .from("user_groups")
    //                 .upsert(
    //                     { user_id: newUser.id, group_id: invitationDetails.group_id },
    //                     { onConflict: "user_id,group_id" }
    //                 );
    //             if (ugError) throw new Error(ugError.message);
    //         }

    //         // 3. Mark invitation accepted
    //         await supabase
    //             .from("invitations")
    //             .update({ status: "accepted" })
    //             .eq("id", invitationDetails.id);

    //         setStep(3);

    //     } catch (err) {
    //         console.error("Registration Error:", err);
    //         alert("Failed to complete registration: " + err.message);
    //     }
    // };


    const handleFinalSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const targetRole = invitationDetails?.groups?.role || "external_user";
            const targetCompany =
                invitationDetails?.groups?.company_id ||
                "11111111-1111-1111-1111-111111111111";

            // 🔥 1. Check if NDA is required from the invite
            const assignedNdaStatus = invitationDetails.requires_nda ? "pending" : "not_required";

            // Hash the password securely
            const bcrypt = require('bcryptjs');
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(formData.password, salt);

            // 2. Insert user with nda_status and dms_role
            const { data: newUser, error: userError } = await supabase
                .from("users")
                .insert({
                    name: formData.name,
                    email: invitationDetails.email,
                    phone_number: formData.mobile,
                    password_hash: hashedPassword,
                    role: targetRole,
                    company_id: targetCompany,
                    status: "active",
                    nda_status: assignedNdaStatus,
                    dms_role: "seller", // <-- Set dms_role to seller
                })
                .select("id")
                .single();

            if (userError) throw new Error(userError.message);

            // 3. Call secure backend to assign permissions and update invitation
            const assignRes = await fetch("/api/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: newUser.id,
                    invitation_id: invitationDetails.id,
                    group_id: invitationDetails.group_id,
                    workspace_id: invitationDetails.groups?.workspace_id,
                    role: targetRole,
                    invited_by: invitationDetails.invited_by
                })
            });
            const assignData = await assignRes.json();
            if (!assignRes.ok) throw new Error(assignData.error || "Failed to assign workspace access");


            // 🔥 5. THE FORK IN THE ROAD 🔥
            if (invitationDetails.requires_nda) {
                // If NDA is ON: Create a temporary session and route to NDA Page
                localStorage.setItem('vdr_session', JSON.stringify({
                    id: newUser.id,
                    company_id: targetCompany,
                    name: formData.name,
                    email: invitationDetails.email,
                    role: targetRole,
                    nda_status: assignedNdaStatus
                }));
                router.push("/sign-nda?from=register");
            } else {
                // If NDA is OFF: Show the "Registration Successful" Step 2 UI
                setStep(2);
            }

        } catch (err) {
            console.error("Registration Error:", err);
            alert("Failed to complete registration: " + err.message);
        }
    };

    // const handleFinalSubmit = async () => {
    //     if (formData.password !== formData.confirmPassword) {
    //         alert("Passwords do not match.");
    //         return;
    //     }

    //     try {
    //         // Set role based on group name (if it matches enum, use it; else external_user)
    //         // const VALID_ROLES = ["admin", "sub_admin", "super_admin", "external_user"];
    //         // const groupName = invitationDetails?.groups?.name || "";
    //         // const normalizedName = groupName.trim().toLowerCase().replace(/\s+/g, "_");
    //         // const targetRole = VALID_ROLES.includes(normalizedName) ? normalizedName : "external_user";
    //         const targetRole = invitationDetails?.groups?.role || "external_user";

    //         const targetCompany =
    //             invitationDetails?.groups?.company_id ||
    //             "11111111-1111-1111-1111-111111111111";

    //         // 1. Insert user
    //         const { data: newUser, error: userError } = await supabase
    //             .from("users")
    //             .insert({
    //                 name: formData.name,
    //                 email: invitationDetails.email,
    //                 phone_number: formData.mobile,
    //                 password_hash: formData.password,
    //                 role: targetRole,
    //                 company_id: targetCompany,
    //                 status: "active",
    //             })
    //             .select("id")
    //             .single();

    //         if (userError) throw new Error(userError.message);

    //         // 2. ALWAYS insert into user_groups (ALL group types)
    //         const { error: ugError } = await supabase
    //             .from("user_groups")
    //             .upsert(
    //                 { user_id: newUser.id, group_id: invitationDetails.group_id },
    //                 { onConflict: "user_id,group_id" }
    //             );
    //         if (ugError) throw new Error(ugError.message);

    //         // 3. Mark invitation accepted
    //         await supabase
    //             .from("invitations")
    //             .update({ status: "accepted" })
    //             .eq("id", invitationDetails.id);

    //         setStep(2);

    //     } catch (err) {
    //         console.error("Registration Error:", err);
    //         alert("Failed to complete registration: " + err.message);
    //     }
    // };


    if (loadingInvite) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500 font-semibold animate-pulse">Verifying invitation token...</p>
            </div>
        );
    }

    if (errorState) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800">{errorState}</h1>
                <Link href="/login" className="text-brand hover:underline">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>

            <div className="relative w-full max-w-md">
                <div className="flex flex-col items-center gap-3 mb-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gray-900 to-slate-800 flex items-center justify-center shadow-md">
                        <FiShield className="text-white text-2xl" />
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900">
                        {step === 1
                            ? "Create Account"
                            : step === 2
                                ? "Verify OTP"
                                : "Success"}
                    </h1>

                    <p className="text-gray-600 text-sm">
                        {invitationDetails ? `Accepting Invitation for sector @${invitationDetails.groups.name}` : "Secure VDR Registration"}
                    </p>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
                            1
                        </div>

                        <div className="w-16 h-1 bg-gray-300 rounded"></div>

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
                            2
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    {step === 1 && (
                        sessionUser && sessionUser.email === invitationDetails?.email ? (
                            <div className="text-center py-6 space-y-5">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
                                    <FaUser className="text-3xl" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Welcome back, {sessionUser.name}!</h2>
                                <p className="text-slate-600 text-sm">
                                    You are currently logged in. Click below to accept the invitation and join the workspace.
                                </p>
                                <button
                                    onClick={handleAcceptExisting}
                                    disabled={submitting}
                                    className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? "Accepting..." : "Accept Invitation"}
                                </button>
                            </div>
                        ) : isExistingUser ? (
                            <div className="text-center py-6 space-y-5">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                                    <FaLock className="text-3xl" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Account Already Exists</h2>
                                <p className="text-slate-600 text-sm">
                                    An account with the email <strong>{invitationDetails?.email}</strong> is already registered. Please log in to accept this invitation.
                                </p>
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem("vdr_redirect_url", `/register/${token}`);
                                        router.push("/login");
                                    }}
                                    className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition"
                                >
                                    Log In to Accept
                                </button>
                            </div>
                        ) : (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={true}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-slate-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Type
                                </label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="type"
                                        value="Seller"
                                        disabled={true}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-slate-500 font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="Enter your mobile number"
                                        className={`w-full pl-12 pr-4 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand ${mobileError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                                        required
                                    />
                                </div>
                                {mobileError && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{mobileError}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password"
                                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                        className={`w-full pl-12 pr-12 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">{passwordError}</p>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
                                        alert("Please fill all required fields.");
                                        return;
                                    }
                                    if (mobileError) {
                                        alert("Please resolve the errors before continuing.");
                                        return;
                                    }
                                    if (passwordError || formData.password !== formData.confirmPassword) {
                                        alert("Passwords do not match.");
                                        return;
                                    }
                                    handleFinalSubmit();
                                }}
                                className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-semibold transition"
                            >
                                Verify & Create Account
                            </button>
                        </div>
                        )
                    )}

                    {step === 2 && (
                        <div className="text-center py-6">
                            <FaCheckCircle className="text-green-500 text-7xl mx-auto" />
                            <h2 className="text-3xl font-bold mt-4 text-slate-900">
                                Registration Successful
                            </h2>
                            <p className="text-gray-600 mt-2">
                                Your account has been created successfully.
                            </p>
                            <Link
                                href="/dms/login"
                                className="block mt-6 w-full py-3 bg-brand text-white rounded-xl"
                            >
                                Go To Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
