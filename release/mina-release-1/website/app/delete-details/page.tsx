"use client";

import { FormEvent, useState } from "react";

export default function DeleteDetailsPage() {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent("Request to delete my account and data");

    const body = encodeURIComponent(
      `Hello,

I would like to request the deletion of my account and associated personal data.

Account email: ${email}

Additional information:
${details || "None provided"}

Please confirm when my account and data have been deleted.`
    );

    window.location.href =
      `mailto:alankelly@chiasmatic.co?subject=${subject}&body=${body}`;
  }

  return (
    <main className="delete-page">
      <section className="delete-card">
        <h1>Delete My Details</h1>

        <p>
          Use this form to request deletion of your account and associated
          personal information.
        </p>

        <p>
          We may contact you to verify your identity before completing your
          request.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Account email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="details">Additional information</label>
          <textarea
            id="details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="For example, your name or user ID"
            rows={5}
          />

          <button type="submit">Submit deletion request</button>
        </form>

        <p className="small-text">
          You can also email{" "}
          <a href="mailto:alankelly@chiasmatic.co">
            alankelly@chiasmatic.co
          </a>{" "}
          directly.
        </p>
      </section>
    </main>
  );
}