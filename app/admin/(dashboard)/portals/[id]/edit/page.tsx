"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import HeroEditor from "@/components/admin/portals/HeroEditor";
import PortalItemsList from "@/components/admin/portals/PortalItemsList";
import AttachLibraryModal from "@/components/admin/portals/AttachLibraryModal";
import PortalSpecificItemModal from "@/components/admin/portals/PortalSpecificItemModal";

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

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroPreset, setHeroPreset] = useState("minimal");
  const [items, setItems] = useState<PortalItem[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showSpecificModal, setShowSpecificModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchItems() {
    const res = await fetch(`/api/portal/${portalId}/items`);
    const data = await res.json();
    setItems(data.items || []);
    setIsLoading(false);
  }

  useEffect(() => {
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
          <Button variant="secondary" onClick={() => setShowAttachModal(true)}>
            + Attach from Library
          </Button>
          <Button variant="secondary" onClick={() => setShowSpecificModal(true)}>
            + Portal-Specific Content
          </Button>
        </div>
      </div>

      <Card>
        <HeroEditor
          heroTitle={heroTitle}
          heroSubtitle={heroSubtitle}
          heroImage={heroImage}
          heroPreset={heroPreset}
          onChange={handleHeroChange}
        />
      </Card>

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
