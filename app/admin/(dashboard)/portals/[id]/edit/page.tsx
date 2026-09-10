"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import HeroEditor from "@/components/admin/portals/HeroEditor";
import PortalItemsList from "@/components/admin/portals/PortalItemsList";
import AttachLibraryModal from "@/components/admin/portals/AttachLibraryModal";
import PortalSpecificItemModal from "@/components/admin/portals/PortalSpecificItemModal";
import { updatePortalAction } from "../../actions";

interface PortalItem {
  id: number;
  sourceType: string;
  resolvedTitle: string;
  resolvedType: string;
  resolvedCategory: string | null;
  position: number;
}

export default function PortalEditPage() {
  const params = useParams();
  const portalId = Number(params.id);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroPreset, setHeroPreset] = useState("minimal");
  const [items, setItems] = useState<PortalItem[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showSpecificModal, setShowSpecificModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchPortal() {
    const res = await fetch(`/api/portal/${portalId}`);
    if (!res.ok) {
      setIsLoading(false);
      return;
    }
    const data = await res.json();
    if (data.portal) {
      setSlug(data.portal.slug || "");
      setName(data.portal.name || "");
      setDepartureDate(data.portal.departureDate || "");
      setReturnDate(data.portal.returnDate || "");
      setHeroTitle(data.portal.heroTitle || "");
      setHeroSubtitle(data.portal.heroSubtitle || "");
      setHeroImage(data.portal.heroImage || "");
      setHeroPreset(data.portal.heroPreset || "minimal");
    }
  }

  async function fetchItems() {
    const res = await fetch(`/api/portal/${portalId}/items`);
    const data = await res.json();
    setItems(data.items || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchPortal();
    fetchItems();
  }, [portalId]);

  function handleHeroChange(field: string, value: string) {
    if (field === "heroTitle") setHeroTitle(value);
    if (field === "heroSubtitle") setHeroSubtitle(value);
    if (field === "heroImage") setHeroImage(value);
    if (field === "heroPreset") setHeroPreset(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Portal</h2>
        <div className="flex gap-3">
          <a href={`/admin/portals/${portalId}/preview`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost">Preview Wall ↗</Button>
          </a>
          <Button variant="secondary" onClick={() => setShowAttachModal(true)}>
            + Attach from Library
          </Button>
          <Button variant="secondary" onClick={() => setShowSpecificModal(true)}>
            + Portal-Specific Content
          </Button>
        </div>
      </div>

      <form action={updatePortalAction}>
        <input type="hidden" name="portalId" value={portalId} />
        <input type="hidden" name="heroTitle" value={heroTitle} />
        <input type="hidden" name="heroSubtitle" value={heroSubtitle} />
        <input type="hidden" name="heroImage" value={heroImage} />
        <input type="hidden" name="heroPreset" value={heroPreset} />

        <Card>
          <h3 className="font-semibold mb-4">Portal Info</h3>
          <div className="space-y-4">
            <Input
              label="Portal Name *"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Smith Family Disney Trip"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Departure Date"
                name="departureDate"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
              <Input
                label="Return Date"
                name="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <HeroEditor
            heroTitle={heroTitle}
            heroSubtitle={heroSubtitle}
            heroImage={heroImage}
            heroPreset={heroPreset}
            onChange={handleHeroChange}
          />
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>

      <Card>
        <h3 className="font-semibold mb-4">Content on Wall ({items.length})</h3>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <PortalItemsList portalId={portalId} items={items} onChanged={fetchItems} />
        )}
      </Card>

      {showAttachModal && (
        <AttachLibraryModal
          portalId={portalId}
          onClose={() => setShowAttachModal(false)}
          onAttached={() => {
            setShowAttachModal(false);
            fetchItems();
          }}
        />
      )}

      {showSpecificModal && (
        <PortalSpecificItemModal
          portalId={portalId}
          onClose={() => setShowSpecificModal(false)}
          onSaved={() => {
            setShowSpecificModal(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
