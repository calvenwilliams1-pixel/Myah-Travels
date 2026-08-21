"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { submitInquiryAction } from "./actions";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!fullName) {
      setError("Please enter your name.");
      return;
    }

    if (!phone && !email) {
      setError("Please provide at least one contact method (phone or email).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitInquiryAction(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <Card>
          <h1 className="text-2xl font-semibold mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your inquiry has been received. Myah will be in touch soon.
          </p>
          <a href="/" className="text-emerald-700 hover:underline">
            Return to Home
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Start Planning Your Trip</h1>
      <p className="text-gray-600 mb-8">
        Fill out what you're comfortable sharing. All fields are optional except your name and one way to contact you.
        Your information is never shared.
      </p>

      <Card>
        <form action={handleSubmit} className="space-y-6">
          <Input
            label="Full Name *"
            name="fullName"
            required
            placeholder="Jane Doe"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="jane@example.com"
            />
          </div>

          <p className="text-sm text-gray-500">
            * At least one of phone or email is required so we can contact you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700">
              How Did You Find Us?
              <select
                name="howFound"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="youtube">YouTube</option>
                <option value="google">Google Search</option>
                <option value="social">Social Media</option>
                <option value="referral">Referral from Friend/Family</option>
                <option value="existing">Existing Client</option>
                <option value="other">Other</option>
              </select>
            </label>

            <Input
              label="Destination in Mind?"
              name="destination"
              placeholder="Japan, Disney, Mexico..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Trip Duration (days)"
              name="tripDurationDays"
              type="number"
              min={1}
              max={365}
              placeholder="7"
            />
            <Input
              label="Departure Month/Year"
              name="departureMonthYear"
              placeholder="June 2027"
            />
            <Input
              label="Return Month/Year"
              name="returnMonthYear"
              placeholder="July 2027"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Best Time to Contact You
            <select
              name="bestTimeToContact"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Anytime</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Anything else you'd like to share?
            <textarea
              name="customStatement"
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Tell us about your dream trip..."
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="consentToContact"
              className="mt-1"
            />
            I consent to being contacted about my travel inquiry.
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Submit Inquiry
          </Button>
        </form>
      </Card>
    </div>
  );
}
