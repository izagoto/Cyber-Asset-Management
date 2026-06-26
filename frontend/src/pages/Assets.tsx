import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Download,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Asset } from "../types";
import {
  CustomSelect,
  CustomMultiSelect,
  CategoryDropdown,
} from "../components/CustomDropdown";

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BORROWED: "bg-blue-50 text-blue-700 border-blue-200",
    MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
    MISSING: "bg-red-50 text-red-700 border-red-200",
    LOST: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    AVAILABLE: "Available",
    BORROWED: "Borrowed",
    MAINTENANCE: "Maintenance",
    MISSING: "Missing",
    LOST: "Lost",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${cfg[status] ?? cfg.AVAILABLE}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function Assets() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(
    () => sessionStorage.getItem("assets_showModal") === "true",
  );

  const [searchParams, setSearchParams] = useSearchParams();

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")
      ? searchParams.get("categories")!.split(",")
      : [],
  );
  const [statusFilter, setStatusFilter] = useState("available");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [entriesPerPage, setEntriesPerPage] = useState(
    Number(searchParams.get("limit")) || 10,
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (currentPage > 1) params.set("page", String(currentPage));
    if (entriesPerPage !== 10) params.set("limit", String(entriesPerPage));
    if (selectedCategories.length > 0)
      params.set("categories", selectedCategories.join(","));
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    currentPage,
    entriesPerPage,
    selectedCategories,
    setSearchParams,
  ]);

  useEffect(() => {
    if (showModal) sessionStorage.setItem("assets_showModal", "true");
    else sessionStorage.removeItem("assets_showModal");
  }, [showModal]);

  // Modal form states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategorySubmitting, setQuickCategorySubmitting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setNewName("");
    setNewCategory("");
    setNewSerialNumber("");
    setNewQuantity(1);
    setNewDescription("");
    setNewStatus("");
    setEditingAsset(null);
    setErrorMessage("");
    setFieldErrors({});
    setShowQuickAddCategory(false);
    setQuickCategoryName("");
    setQuickCategoryDescription("");
  };

  const filterInitializedRef = useRef(false);

  const fetchAssets = async () => {
    try {
      const res = await api.get("/assets");
      const data = res.data.data ?? [];
      data.sort((a: Asset, b: Asset) => a.id - b.id);
      setAssets(data);
      if (!filterInitializedRef.current && data.length > 0) {
        const uniqueCats = Array.from(
          new Set(data.map((a: Asset) => a.category || "Uncategorized")),
        ).sort() as string[];
        setSelectedCategories(uniqueCats);
        filterInitializedRef.current = true;
      }
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/assets/categories");
      setDbCategories(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const handleQuickAddCategory = async () => {
    setQuickCategorySubmitting(true);
    setFieldErrors({});

    try {
      const errors: Record<string, string> = {};
      if (!quickCategoryName.trim())
        errors.quickCategoryName = "Category name is required.";

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setQuickCategorySubmitting(false);
        return;
      }

      const payload = {
        name: quickCategoryName.trim(),
        description: quickCategoryDescription.trim() || "",
        is_active: true,
      };

      const res = await api.post("/categories", payload);
      const newCategoryData = res.data.data;

      setDbCategories((prev) => [...prev, newCategoryData.name].sort());
      setNewCategory(newCategoryData.name);
      setShowQuickAddCategory(false);
      setQuickCategoryName("");
      setQuickCategoryDescription("");
    } catch (err: any) {
      console.error("Failed to quick add category", err);
      if (err.response?.data?.detail) {
        setFieldErrors({ quickCategoryName: err.response.data.detail });
      } else {
        setFieldErrors({ quickCategoryName: "Failed to add category." });
      }
    } finally {
      setQuickCategorySubmitting(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  const categories =
    dbCategories.length > 0
      ? dbCategories
      : Array.from(
          new Set(assets.map((a) => a.category || "Uncategorized")),
        ).sort();

  // Filtering Logic
  const filtered = assets.filter((asset) => {
    let matchesStatus = false;
    if (statusFilter === "available") {
      matchesStatus = asset.status === "AVAILABLE";
    } else if (statusFilter === "borrowed") {
      matchesStatus = asset.status === "BORROWED";
    } else if (statusFilter === "maintenance") {
      matchesStatus = asset.status === "MAINTENANCE";
    } else if (statusFilter === "lost") {
      matchesStatus = asset.status === "LOST" || asset.status === "MISSING";
    }

    const assetCategory = asset.category || "Uncategorized";
    const matchesCategory = selectedCategories.includes(assetCategory);
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toString().includes(searchQuery) ||
      (asset.category?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (asset.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      );

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Pagination Calculation
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  // Adjust current page if out of bounds (e.g. after search filters narrow down the list)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const indexOfLastAsset = currentPage * entriesPerPage;
  const indexOfFirstAsset = indexOfLastAsset - entriesPerPage;
  const currentAssets = filtered.slice(indexOfFirstAsset, indexOfLastAsset);

  const openDeleteModal = (asset: Asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    setSubmitting(true);
    const assetName = assetToDelete.name;
    try {
      await api.delete(`/assets/${assetToDelete.id}`);
      fetchAssets();
      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        setAssetToDelete(null);
        setDeleteSuccess(false);
      }, 1500);
      showToast(
        `Asset "${assetName}" has been successfully deleted.`,
        "success",
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.detail || err.message || "Failed to delete asset.",
        "error",
      );
      setSubmitting(false);
    }
  };

  const executeSaveAsset = async () => {
    setSubmitting(true);
    setErrorMessage("");

    try {
      const catName = newCategory || "Uncategorized";
      const payload = {
        name: newName,
        category: catName,
        serial_number: newSerialNumber || null,
        quantity: newQuantity,
        description: newDescription || "",
        status: newStatus,
      };

      if (editingAsset) {
        await api.patch(`/assets/${editingAsset.id}`, payload);
      } else {
        await api.post("/assets", payload);
      }

      if (!selectedCategories.includes(catName)) {
        setSelectedCategories((prev) => [...prev, catName]);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        resetForm();
        setShowSaveConfirmModal(false);
        setShowModal(false);
        setSaveSuccess(false);
        setCurrentPage(1);
        fetchAssets();
      }, 1500);
      showToast(
        editingAsset
          ? "Asset updated successfully!"
          : "New asset added successfully!",
        "success",
      );
    } catch (err: any) {
      console.error("Failed to save asset", err);
      setShowSaveConfirmModal(false);
      if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage("An unexpected error occurred while saving the asset.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Asset ID",
      "Asset Name",
      "Category",
      "Serial Number",
      "Description",
      "Status",
      "Created At",
    ];
    const rows = filtered.map((a) => [
      `AST-${a.id}`,
      a.name,
      a.category || "",
      a.serial_number || "",
      a.description || "",
      a.status,
      a.created_at,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) =>
          e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `asset_inventory_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Main Asset Container Card */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        {/* Card Header (Matching Active Sidebar Style) */}
        <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="text-[#DC2626]" />
            <div className="text-base font-bold text-[#18181B] tracking-wide">
              Asset Inventory Registry
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#107C41] hover:bg-[#0C6A36] text-white border border-[#107C41] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Download size={13} className="text-white" /> Export CSV
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Add Asset
              </button>
            )}
          </div>
        </div>

        {/* Sub-menu Tabs */}
        <div className="flex border-b border-[#E4E4E7] bg-[#FCFCFC] px-6 gap-6 shrink-0">
          {[
            {
              id: "available",
              label: "Available Assets",
              count: assets.filter((a) => a.status === "AVAILABLE").length,
            },
            {
              id: "borrowed",
              label: "Borrowed Assets",
              count: assets.filter((a) => a.status === "BORROWED").length,
            },
            {
              id: "maintenance",
              label: "Maintenance",
              count: assets.filter((a) => a.status === "MAINTENANCE").length,
            },
            {
              id: "lost",
              label: "Lost Missing",
              count: assets.filter(
                (a) => a.status === "LOST" || a.status === "MISSING",
              ).length,
            },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-3 px-1 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-transparent text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    tab.count > 0
                      ? tab.id === "available"
                        ? "bg-emerald-100 text-emerald-700"
                        : tab.id === "borrowed"
                          ? "bg-blue-100 text-blue-700"
                          : tab.id === "maintenance"
                            ? "bg-amber-100 text-amber-700"
                            : tab.id === "lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-[#E4E4E7] text-[#52525B]"
                      : tab.id === "lost"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[#E4E4E7] text-[#52525B]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Filters, and Entries Selector */}
        <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries dropdown selector */}
          <div className="flex items-center gap-2 text-sm text-[#52525B]">
            <span>Show</span>
            <CustomSelect
              value={entriesPerPage}
              onChange={(size) => {
                setEntriesPerPage(size);
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: 5 },
                { value: 10, label: 10 },
                { value: 20, label: 20 },
                { value: 50, label: 50 },
              ]}
            />
            <span>result per page</span>
          </div>

          {/* Search bar & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#DC2626] transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Filter in records..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64 sm:w-80 bg-white border border-[#E4E4E7] rounded pl-9 pr-8 py-2 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Custom Multi-Select Filter */}
            <CustomMultiSelect
              selectedValues={selectedCategories}
              onChange={(vals) => {
                setSelectedCategories(vals);
                setCurrentPage(1);
              }}
              options={categories}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#DC2626] text-xs font-mono animate-pulse">
              Loading assets data feed...
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#F4F4F5] border-y border-[#E4E4E7]">
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap w-24">
                    Asset ID
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[#475569]">Asset Name</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">
                    Serial Number
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap w-16">
                    Total Qty
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap w-16">
                    Available
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">
                    Description
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap w-24">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#18181B] whitespace-nowrap w-24">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {currentAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#F9FAFB] transition-colors bg-white border-b border-[#E4E4E7]"
                  >
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                      AST-{asset.id}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-[#4B5563]">
                        {asset.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563] whitespace-nowrap">
                      {asset.serial_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                      {asset.quantity}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">
                      {asset.available_quantity ?? asset.quantity}
                    </td>
                    <td
                      className="px-6 py-4 text-[14px] text-[#4B5563] max-w-[220px] truncate"
                      title={asset.description}
                    >
                      {asset.description || "-"}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setNewName(asset.name);
                                setNewCategory(asset.category || "");
                                setNewSerialNumber(asset.serial_number || "");
                                setNewQuantity(asset.quantity);
                                setNewDescription(asset.description || "");
                                setNewStatus(asset.status);
                                setErrorMessage("");
                                setShowModal(true);
                              }}
                              className="p-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] rounded cursor-pointer shadow-sm transition-colors"
                              title="Edit Asset"
                            >
                              <Edit2 size={15} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(asset)}
                              className="p-1.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded cursor-pointer shadow-sm transition-colors"
                              title="Delete Asset"
                            >
                              <Trash2 size={15} strokeWidth={2.5} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] text-[#A1A1AA] font-mono">
                            -
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-xs font-mono text-[#71717A]"
                    >
                      No assets match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="bg-[#FAFAFA] border-t border-[#E4E4E7] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs font-mono text-[#71717A]">
              Showing{" "}
              <span className="font-bold text-[#18181B]">
                {totalItems === 0 ? 0 : indexOfFirstAsset + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#18181B]">
                {Math.min(indexOfLastAsset, totalItems)}
              </span>{" "}
              of <span className="font-bold text-[#18181B]">{totalItems}</span>{" "}
              entries
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-1.5 border border-[#E4E4E7] bg-white rounded-lg hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white border-[#DC2626] shadow-sm"
                        : "bg-white border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-1.5 border border-[#E4E4E7] bg-white rounded-lg hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const errors: Record<string, string> = {};
                if (!newName.trim()) errors.newName = "Asset Name is required.";
                if (!newQuantity || newQuantity < 1)
                  errors.newQuantity = "Quantity must be at least 1.";
                if (!newStatus) errors.newStatus = "Status is required.";

                if (Object.keys(errors).length > 0) {
                  setFieldErrors(errors);
                  return;
                }

                setFieldErrors({});
                setErrorMessage("");
                setShowSaveConfirmModal(true);
              }}
              className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between px-8 py-5 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#18181B] rounded-t-2xl">
                <div>
                  <div className="text-sm font-mono font-bold">
                    {editingAsset ? "Edit Asset" : "Add Asset"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmModal(true)}
                  className="text-[#71717A] hover:text-[#18181B] hover:bg-[#E4E4E7] rounded transition-all p-1"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {errorMessage && (
                  <div className="col-span-1 sm:col-span-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono">
                    {errorMessage}
                  </div>
                )}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (fieldErrors.newName)
                        setFieldErrors((prev) => ({ ...prev, newName: "" }));
                    }}
                    className={`w-full bg-[#FFFFFF] border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.newName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20"}`}
                  />
                  {fieldErrors.newName && (
                    <span className="text-red-500 text-[10px] font-mono mt-1 block">
                      {fieldErrors.newName}
                    </span>
                  )}
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">
                    Category
                  </label>
                  <CategoryDropdown
                    value={newCategory}
                    onChange={(val) => setNewCategory(val)}
                    options={categories}
                    allowCustom={false}
                  />
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCategory(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E4E4E7] hover:border-[#DC2626] hover:text-[#DC2626] text-[#52525B] text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer"
                    >
                      <Plus size={11} /> Quick Add New Category
                    </button>

                    {showQuickAddCategory && (
                      <div className="p-4 bg-white border border-[#E4E4E7] rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 w-full sm:max-w-2xl">
                        <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider font-bold">
                          Add New Category
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-[#71717A] block mb-1 tracking-wider">
                              Category Name *
                            </label>
                            <input
                              type="text"
                              value={quickCategoryName}
                              onChange={(e) => {
                                setQuickCategoryName(e.target.value);
                                if (fieldErrors.quickCategoryName)
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    quickCategoryName: "",
                                  }));
                              }}
                              className={`w-full bg-[#FFFFFF] border rounded-lg px-3 py-2 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 transition-all ${fieldErrors.quickCategoryName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20"}`}
                            />
                            {fieldErrors.quickCategoryName && (
                              <span className="text-red-500 text-[10px] font-mono mt-0.5 block">
                                {fieldErrors.quickCategoryName}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-[#71717A] flex items-center justify-between mb-1 tracking-wider">
                              <span>Description</span>
                              <span className="text-[9px] text-[#A1A1AA] tracking-normal normal-case italic">
                                Optional
                              </span>
                            </label>
                            <textarea
                              value={quickCategoryDescription}
                              onChange={(e) =>
                                setQuickCategoryDescription(e.target.value)
                              }
                              rows={3}
                              className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowQuickAddCategory(false)}
                            className="px-4 py-2 bg-[#6B7280] hover:bg-[#4B5563] text-white text-[10px] font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleQuickAddCategory}
                            disabled={quickCategorySubmitting}
                            className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            {quickCategorySubmitting
                              ? "Saving..."
                              : "Add & Select"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-mono text-[#71717A] flex items-center justify-between mb-1.5 tracking-wider">
                    <span>Serial Number</span>
                    <span className="text-[9px] text-[#A1A1AA] tracking-normal normal-case italic">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => {
                      setNewQuantity(parseInt(e.target.value) || 1);
                      if (fieldErrors.newQuantity)
                        setFieldErrors((prev) => ({
                          ...prev,
                          newQuantity: "",
                        }));
                    }}
                    className={`w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.newQuantity ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-[#DC2626] focus:ring-[#DC2626]/20"}`}
                  />
                  {fieldErrors.newQuantity && (
                    <span className="text-red-500 text-[10px] font-mono mt-1 block">
                      {fieldErrors.newQuantity}
                    </span>
                  )}
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">
                    Status
                  </label>
                  <CustomSelect
                    value={newStatus}
                    onChange={(val) => {
                      setNewStatus(val as string);
                      if (fieldErrors.newStatus)
                        setFieldErrors((prev) => ({ ...prev, newStatus: "" }));
                    }}
                    options={[
                      { value: "", label: "Select Status..." },
                      { value: "AVAILABLE", label: "Available" },
                      { value: "BORROWED", label: "Borrowed" },
                      { value: "MAINTENANCE", label: "Maintenance" },
                      { value: "LOST", label: "Lost" },
                    ]}
                    className={`w-full h-[38px] [&>button]:h-full ${fieldErrors.newStatus ? "[&>button]:border-red-500" : ""}`}
                  />
                  {fieldErrors.newStatus && (
                    <span className="text-red-500 text-[10px] font-mono mt-1 block">
                      {fieldErrors.newStatus}
                    </span>
                  )}
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-mono text-[#71717A] flex items-center justify-between mb-1.5 tracking-wider">
                    <span>Description</span>
                    <span className="text-[9px] text-[#A1A1AA] tracking-normal normal-case italic">
                      Optional
                    </span>
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={7}
                    className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-8 py-5 bg-[#FAFAFA] border-t border-[#E4E4E7] rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmModal(true)}
                  className="px-6 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || !newStatus}
                  className="px-6 py-2.5 bg-linear-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-mono font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editingAsset ? "Save Changes" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal &&
        assetToDelete &&
        createPortal(
          <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 bg-black/45 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {deleteSuccess ? (
                <div className="px-6 py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4 text-[#166534] shadow-sm">
                    <CheckCircle2 size={30} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-mono font-bold text-[#18181B] mb-1">
                    Deleted!
                  </h3>
                  <p className="text-sm font-sans text-[#71717A]">
                    Asset has been permanently removed.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-[#DC2626]">
                    <h3 className="font-mono text-white text-base font-bold">
                      Confirm Deletion
                    </h3>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  {/* Body */}
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                      Are you sure you want to delete{" "}
                      <strong className="text-[#DC2626]">
                        {assetToDelete.name}
                      </strong>
                      ? This action cannot be undone.
                    </p>
                  </div>
                  {/* Footer */}
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-999999 flex items-start justify-center p-4 pt-6 sm:pt-8 bg-black/45 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 bg-[#F59E0B]">
                <h3 className="font-mono text-white text-base font-bold">
                  Discard Changes?
                </h3>
                <button
                  onClick={() => setShowCancelConfirmModal(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                  Are you sure you want to cancel? Any unsaved changes will be
                  lost.
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmModal(false)}
                  className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  No, Keep Editing
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirmModal(false);
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Yes, Discard
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-999999 flex items-start justify-center p-4 pt-6 sm:pt-8 bg-black/45 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {saveSuccess ? (
                <div className="px-6 py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4 text-[#166534] shadow-sm">
                    <CheckCircle2 size={30} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-mono font-bold text-[#18181B] mb-1">
                    Saved!
                  </h3>
                  <p className="text-sm font-sans text-[#71717A]">
                    Asset data has been saved successfully.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-4 bg-[#10B981]">
                    <h3 className="font-mono text-white text-base font-bold">
                      Confirm Save
                    </h3>
                    <button
                      onClick={() => setShowSaveConfirmModal(false)}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                      Are you sure you want to save{" "}
                      {editingAsset ? "these changes" : "this new asset"}?
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                    <button
                      type="button"
                      onClick={() => setShowSaveConfirmModal(false)}
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeSaveAsset}
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "Saving..." : "Confirm Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* Global Toast Notification */}
      {toast &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-999999 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border ${
                toast.type === "success"
                  ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                  : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              }`}
            >
              <div
                className={`p-1 rounded-full ${toast.type === "success" ? "bg-[#DCFCE7]" : "bg-[#FEE2E2]"}`}
              >
                {toast.type === "success" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <X size={16} strokeWidth={3} />
                )}
              </div>
              <p className="text-sm font-sans font-medium pr-2">
                {toast.message}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
