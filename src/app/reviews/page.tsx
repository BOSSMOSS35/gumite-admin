"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  AlertCircle,
  RefreshCw,
  Star,
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  Award,
} from "lucide-react";
import {
  getPendingReviews,
  getFlaggedReviews,
  getAdminReview,
  moderateReview,
  addAdminResponse,
  setReviewFeatured,
  deleteAdminReview,
  AdminReview,
  getReviewStatusDisplay,
  formatDate,
} from "@/lib/api";
import { toast } from "sonner";

type Tab = "pending" | "flagged";

function ReviewStatusBadge({ status }: { status: string }) {
  const { label, color } = getReviewStatusDisplay(status as any);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [pagination, setPagination] = useState({
    size: 20,
    page: 0,
    total: 0,
  });

  // Dialog states
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Read tab from URL search params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "flagged") setActiveTab("flagged");
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetcher = activeTab === "pending" ? getPendingReviews : getFlaggedReviews;
      const response = await fetcher({
        page: pagination.page,
        size: pagination.size,
      });
      setReviews(response.reviews);
      setPagination((prev) => ({ ...prev, total: response.total }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeTab, pagination.page, pagination.size]);

  const handleModerate = async (reviewId: string, approved: boolean) => {
    setActionLoading(reviewId);
    try {
      await moderateReview(reviewId, { approved });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      setShowDetailDialog(false);
      toast.success(approved ? "Review approved" : "Review rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to moderate review");
      toast.error(err instanceof Error ? err.message : "Failed to moderate review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedReview || !adminResponseText.trim()) return;
    setActionLoading("response");
    try {
      const result = await addAdminResponse(selectedReview.id, adminResponseText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === selectedReview.id ? result.review : r))
      );
      setShowResponseDialog(false);
      setAdminResponseText("");
      toast.success("Response added successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add response");
      toast.error(err instanceof Error ? err.message : "Failed to add response");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (review: AdminReview) => {
    setActionLoading(review.id);
    try {
      const result = await setReviewFeatured(review.id, !review.isFeatured);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? result.review : r))
      );
      toast.success(review.isFeatured ? "Review unfeatured" : "Review featured");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update featured status");
      toast.error(err instanceof Error ? err.message : "Failed to update featured status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    setActionLoading("delete");
    try {
      await deleteAdminReview(selectedReview.id, deleteReason || undefined);
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      setShowDeleteDialog(false);
      setDeleteReason("");
      toast.success("Review deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.size);
  const currentPage = pagination.page + 1;

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page: page - 1 }));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "pending" ? pagination.total : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged Reviews</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "flagged" ? pagination.total : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Reported by users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "pending" ? "Pending" : "Flagged"} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold">Reviews</CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === "pending"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveTab("pending");
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
              >
                Pending
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === "flagged"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveTab("flagged");
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
              >
                Flagged
              </button>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchReviews} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchReviews} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No {activeTab} reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow
                      key={review.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowDetailDialog(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{review.customerName}</span>
                          {review.verifiedPurchase && (
                            <span className="text-xs text-green-600">Verified Purchase</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarDisplay rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-1">{review.title}</span>
                      </TableCell>
                      <TableCell>
                        <ReviewStatusBadge status={review.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleModerate(review.id, true)}
                            disabled={actionLoading === review.id}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleModerate(review.id, false)}
                            disabled={actionLoading === review.id}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowResponseDialog(true);
                            }}
                            title="Add Response"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {pagination.page * pagination.size + 1} to{" "}
                {Math.min((pagination.page + 1) * pagination.size, pagination.total)} of{" "}
                {pagination.total} reviews
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                  By {selectedReview.customerName} on {formatDate(selectedReview.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <StarDisplay rating={selectedReview.rating} />
                  <ReviewStatusBadge status={selectedReview.status} />
                  {selectedReview.verifiedPurchase && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Verified Purchase
                    </span>
                  )}
                  {selectedReview.isFeatured && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{selectedReview.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReview.content}</p>
                </div>
                {selectedReview.pros && selectedReview.pros.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-700">Pros</h5>
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                      {selectedReview.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedReview.cons && selectedReview.cons.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700">Cons</h5>
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                      {selectedReview.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> {selectedReview.helpfulCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3.5 w-3.5" /> {selectedReview.notHelpfulCount}
                  </span>
                </div>
                {selectedReview.adminResponse && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response</p>
                    <p className="text-sm">{selectedReview.adminResponse}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleFeatured(selectedReview)}
                  disabled={actionLoading === selectedReview.id}
                >
                  <Award className="h-4 w-4 mr-1" />
                  {selectedReview.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDetailDialog(false);
                    setShowResponseDialog(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Respond
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    setShowDetailDialog(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleModerate(selectedReview.id, true)}
                  disabled={actionLoading === selectedReview.id}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleModerate(selectedReview.id, false)}
                  disabled={actionLoading === selectedReview.id}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Response</DialogTitle>
            <DialogDescription>
              This response will be publicly visible under the review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[120px] p-3 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Write your response..."
              value={adminResponseText}
              onChange={(e) => setAdminResponseText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddResponse}
              disabled={!adminResponseText.trim() || actionLoading === "response"}
            >
              {actionLoading === "response" ? "Saving..." : "Save Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The review will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Reason for deletion (optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === "delete"}
            >
              {actionLoading === "delete" ? "Deleting..." : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
