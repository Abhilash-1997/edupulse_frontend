import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Accordion,
  AccordionItem,
  addToast
} from "@heroui/react";
import libraryService from '@/services/libraryService';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function SectionBooks() {
  const { id } = useParams();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, [id]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const res = await libraryService.getSectionBookDetais(id);

      if (res.data?.success) {
        setBooks(res.data.data || []);
      } else {
        addToast({
          title: "Error",
          description: "Failed to load section books",
          color: "danger"
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "An error occurred fetching section books",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sectionName = books.length > 0 ? books[0].sectionName : 'Section';

  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase();
    return (
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q) ||
      book.isbn?.toLowerCase().includes(q) ||
      book.category?.toLowerCase().includes(q)
    );
  });

  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const totalAvailable = books.reduce((sum, b) => sum + (b.available || 0), 0);

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Back Button */}
      <Button
        onPress={() => navigate(-1)}
        variant="light"
        startContent={<Icon icon="mdi:arrow-left" />}
        className="mb-2"
      >
        Back
      </Button>

      {/* Section Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Icon icon="mdi:bookshelf" className="text-primary" width={32} />
          {sectionName}
        </h1>
        <p className="text-default-500 mt-1">
          All books belonging to this section
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-content1 border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Icon icon="mdi:book-multiple" className="text-primary" width={28} />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-bold">Total Titles</p>
              <p className="text-2xl font-extrabold text-foreground">{totalBooks}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1 border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <Icon icon="mdi:book-open-page-variant" className="text-secondary" width={28} />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-bold">Total Copies</p>
              <p className="text-2xl font-extrabold text-foreground">{totalCopies}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1 border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className={`p-3 rounded-xl ${totalAvailable > 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
              <Icon
                icon="mdi:check-circle"
                className={totalAvailable > 0 ? 'text-success' : 'text-danger'}
                width={28}
              />
            </div>
            <div>
              <p className="text-xs text-default-500 uppercase font-bold">Available</p>
              <p className={`text-2xl font-extrabold ${totalAvailable > 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {totalAvailable}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title, author, ISBN, or category..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        startContent={<Icon icon="mdi:magnify" className="text-default-400" />}
        isClearable
        onClear={() => setSearchQuery('')}
        className="max-w-md"
      />

      {/* Books List */}
      {filteredBooks.length === 0 ? (
        <Card className="bg-content1 border border-default-200 shadow-sm">
          <CardBody className="p-12 text-center">
            <Icon icon="mdi:book-off-outline" className="text-default-300 mx-auto mb-3" width={48} />
            <p className="text-default-500 text-lg">
              {searchQuery ? 'No books match your search.' : 'No books found in this section.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Accordion variant="splitted" selectionMode="multiple">
          {filteredBooks.map((book) => (
            <AccordionItem
              key={book.id}
              aria-label={book.title}
              title={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 pr-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{book.title}</p>
                    <p className="text-sm text-default-500">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Chip size="sm" variant="flat" color="primary">
                      {book.category || 'Uncategorized'}
                    </Chip>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-default-500">{book.available}/{book.quantity}</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={book.available > 0 ? 'success' : 'danger'}
                      >
                        {book.available > 0 ? 'Available' : 'All Issued'}
                      </Chip>
                    </div>
                  </div>
                </div>
              }
              classNames={{
                base: "bg-content1 border border-default-200 shadow-sm",
                content: "pt-0 pb-4 px-4"
              }}
            >
              {/* Book Detail inside Accordion */}
              <div className="space-y-5">
                {/* Book Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-default-50 rounded-lg">
                  <div>
                    <p className="text-xs text-default-500 uppercase font-semibold">ISBN</p>
                    <p className="font-semibold font-mono text-sm">{book.isbn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500 uppercase font-semibold">Publisher</p>
                    <p className="font-semibold text-sm">{book.publisher || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500 uppercase font-semibold">Total Copies</p>
                    <p className="font-semibold text-sm">{book.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500 uppercase font-semibold">Available</p>
                    <p className={`font-semibold text-sm ${book.available > 0 ? 'text-success' : 'text-danger'}`}>
                      {book.available}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div className="px-1">
                    <p className="text-xs text-default-500 uppercase font-semibold mb-1">Description</p>
                    <p className="text-foreground/80 text-sm leading-relaxed">{book.description}</p>
                  </div>
                )}

                {/* Transaction History */}
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3 px-1">
                    <Icon icon="mdi:history" width={18} />
                    Transaction History ({book.libraryTransactions?.length || 0})
                  </h3>

                  {book.libraryTransactions?.length > 0 ? (
                    <Card className="border border-default-200 shadow-none">
                      <CardBody className="p-0">
                        <Table
                          aria-label={`Transactions for ${book.title}`}
                          shadow="none"
                          classNames={{
                            wrapper: "bg-content1 shadow-none",
                            th: "bg-default-100 text-default-500 font-medium text-xs",
                            td: "text-foreground text-sm"
                          }}
                        >
                          <TableHeader>
                            <TableColumn>USER</TableColumn>
                            <TableColumn>ISSUE DATE</TableColumn>
                            <TableColumn>DUE DATE</TableColumn>
                            <TableColumn>RETURN DATE</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>FINE</TableColumn>
                          </TableHeader>

                          <TableBody>
                            {book.libraryTransactions.map((tx) => (
                              <TableRow key={tx.id} className="border-b border-default-100 last:border-none">
                                <TableCell>
                                  <p className="font-semibold text-foreground">
                                    {tx.user?.name || tx.student?.name}
                                  </p>
                                  <p className="text-xs text-default-500">
                                    {tx.user
                                      ? `${tx.user.role} (${tx.user.email})`
                                      : `Student (${tx.student?.admissionNumber})`}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  {new Date(tx.issueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(tx.dueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {tx.returnDate
                                    ? new Date(tx.returnDate).toLocaleDateString()
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="sm"
                                    color={
                                      tx.status === 'RETURNED'
                                        ? 'success'
                                        : tx.status === 'OVERDUE'
                                          ? 'danger'
                                          : 'warning'
                                    }
                                    variant="flat"
                                  >
                                    {tx.status}
                                  </Chip>
                                </TableCell>
                                <TableCell>
                                  {tx.fineAmount > 0 ? `₹${tx.fineAmount}` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardBody>
                    </Card>
                  ) : (
                    <p className="text-sm text-default-400 italic px-1">
                      No transactions recorded for this book.
                    </p>
                  )}
                </div>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}