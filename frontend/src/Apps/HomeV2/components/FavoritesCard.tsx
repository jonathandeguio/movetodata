/**
 * FavoritesCard — Displays user's pinned pages (favorites) and quick external
 * links. Both lists are stored in localStorage via FavoritesService.
 */

import {
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Button, Card, Input, Modal, Space, Tooltip, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  FavoriteItem,
  FavoritesService,
  LinkItem,
} from "../services/FavoritesService";

const { Text } = Typography;

// ─── Default favorites shown until the user customizes ───────────────────────

const DEFAULT_FAVORITES: Omit<FavoriteItem, "id" | "addedAt">[] = [
  { label: "Catalogue", route: "/portal/projects" },
  { label: "Orchestration", route: "/portal/schedules" },
  { label: "Connecteurs", route: "/portal/connect" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDefaults(): FavoriteItem[] {
  const existing = FavoritesService.getFavorites();
  if (existing.length > 0) return existing;
  DEFAULT_FAVORITES.forEach((d) => FavoritesService.addFavorite(d));
  return FavoritesService.getFavorites();
}

// ─── FavoritesCard ───────────────────────────────────────────────────────────

const FavoritesCard: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  // Add-favorite modal
  const [favModalOpen, setFavModalOpen] = useState(false);
  const [newFavLabel, setNewFavLabel] = useState("");
  const [newFavRoute, setNewFavRoute] = useState("");

  // Add-link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const reload = () => {
    setFavorites(ensureDefaults());
    setLinks(FavoritesService.getLinks());
  };

  useEffect(() => {
    reload();
  }, []);

  const removeFav = (id: string) => {
    FavoritesService.removeFavorite(id);
    reload();
  };

  const addFav = () => {
    if (!newFavLabel.trim() || !newFavRoute.trim()) return;
    FavoritesService.addFavorite({ label: newFavLabel.trim(), route: newFavRoute.trim() });
    setNewFavLabel("");
    setNewFavRoute("");
    setFavModalOpen(false);
    reload();
  };

  const removeLink = (id: string) => {
    FavoritesService.removeLink(id);
    reload();
  };

  const addLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    FavoritesService.addLink({ label: newLinkLabel.trim(), url });
    setNewLinkLabel("");
    setNewLinkUrl("");
    setLinkModalOpen(false);
    reload();
  };

  return (
    <>
      {/* ── Favoris ─────────────────────────────────────────────────────── */}
      <Card
        className="home-panel-card"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StarFilled style={{ color: "#fbb261", fontSize: 14 }} />
            <span className="home-panel-card__title">Favoris</span>
          </div>
        }
        extra={
          <Tooltip title="Ajouter un favori">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setFavModalOpen(true)}
            />
          </Tooltip>
        }
      >
        {favorites.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Aucun favori — cliquez sur + pour en ajouter.
          </Text>
        ) : (
          <ul className="home-fav-list">
            {favorites.map((fav) => (
              <li key={fav.id} className="home-fav-item">
                <button
                  className="home-fav-item__label"
                  onClick={() => navigate(fav.route)}
                >
                  {fav.label}
                </button>
                <Tooltip title="Retirer">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="home-fav-item__remove"
                    onClick={() => removeFav(fav.id)}
                  />
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Liens utiles ────────────────────────────────────────────────── */}
      <Card
        className="home-panel-card"
        style={{ marginTop: 16 }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LinkOutlined style={{ color: "#1f6feb", fontSize: 14 }} />
            <span className="home-panel-card__title">Liens utiles</span>
          </div>
        }
        extra={
          <Tooltip title="Ajouter un lien">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setLinkModalOpen(true)}
            />
          </Tooltip>
        }
      >
        {links.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Aucun lien — cliquez sur + pour en ajouter.
          </Text>
        ) : (
          <ul className="home-fav-list">
            {links.map((link) => (
              <li key={link.id} className="home-fav-item">
                <a
                  className="home-fav-item__label home-fav-item__label--link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
                <Tooltip title="Retirer">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="home-fav-item__remove"
                    onClick={() => removeLink(link.id)}
                  />
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Modal : ajouter un favori ────────────────────────────────────── */}
      <Modal
        title="Ajouter un favori"
        open={favModalOpen}
        onOk={addFav}
        onCancel={() => setFavModalOpen(false)}
        okText="Ajouter"
        cancelText="Annuler"
        okButtonProps={{ disabled: !newFavLabel.trim() || !newFavRoute.trim() }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Nom (ex. Catalogue projets)"
            value={newFavLabel}
            onChange={(e) => setNewFavLabel(e.target.value)}
          />
          <Input
            placeholder="Route (ex. /portal/projects)"
            value={newFavRoute}
            onChange={(e) => setNewFavRoute(e.target.value)}
          />
        </Space>
      </Modal>

      {/* ── Modal : ajouter un lien ──────────────────────────────────────── */}
      <Modal
        title="Ajouter un lien"
        open={linkModalOpen}
        onOk={addLink}
        onCancel={() => setLinkModalOpen(false)}
        okText="Ajouter"
        cancelText="Annuler"
        okButtonProps={{ disabled: !newLinkLabel.trim() || !newLinkUrl.trim() }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Nom (ex. Documentation Spark)"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
          />
          <Input
            placeholder="URL (ex. https://spark.apache.org)"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
        </Space>
      </Modal>
    </>
  );
};

export default FavoritesCard;
