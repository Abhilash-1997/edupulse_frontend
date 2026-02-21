import React, { useEffect, useState } from 'react';
import {
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  addToast,
  Card,
  CardBody
} from "@heroui/react";
import { Icon } from "@iconify/react";
import libraryService from '@/services/libraryService';

export default function ReturnBook() {

  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTx, setSelectedTx] = useState(null);
  const [fine, setFine] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Load issued books on mount
  
  const handleSearch = async () => {
    
    try {
      setIsLoading(true);
      const res = await libraryService.getTransactions({ status: 'ISSUED' });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
      } else {
        addToast({
          title: "Error",
          description: res.data?.message || "Failed to fetch transactions",
          color: "danger"
        });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      addToast({
        title: "Error",
        description: "Failed to fetch transactions",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFine = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();

    if (today > due) {
      const diffTime = today - due;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * 10;
    }
    return 0;
  };

  const onSelectReturn = (tx) => {
    setSelectedTx(tx);
    setFine(calculateFine(tx.dueDate));
    setRemarks('');
  };

  const confirmReturn = async () => {
    try {
      setIsLoading(true);

      const response = await libraryService.returnBook({
        transactionId: selectedTx.id,
        fineAmount: Number(fine),
        remarks,
        returnDate: new Date().toISOString()
      });

      if (response.data?.success) {
        addToast({
          title: "Success",
          description: "Book returned successfully",
          color: "success"
        });

        setSelectedTx(null);
        handleSearch();
      } else {
        addToast({
          title: "Error",
          description: response.data?.message || "Failed to return book",
          color: "danger"
        });
      }

    } catch (error) {
      console.error("Return error:", error);
      addToast({
        title: "Error",
        description: "An unexpected error occurred",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold text-foreground">
        Return Book
      </h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search issued books..."
          value={search}
          onValueChange={setSearch}
          className="max-w-md"
          variant="bordered"
          startContent={<Icon icon="mdi:magnify" />}
        />
        <Button
          color="primary"
          onPress={handleSearch}
          isLoading={isLoading}
        >
          Search
        </Button>
      </div>

      <Card className="bg-content1 border border-default-200 shadow-sm">
        <CardBody className="p-0">

          <Table aria-label="Issued Books">

            <TableHeader>
              <TableColumn>BOOK</TableColumn>
              <TableColumn>ISSUED TO</TableColumn>
              <TableColumn>DUE DATE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTION</TableColumn>
            </TableHeader>

            <TableBody emptyContent="No active issued books found">

              {(transactions || []).map(tx => (

                <TableRow key={tx.id}>

                  <TableCell>
                    <p className="font-semibold">
                      {tx.bookTitle}
                    </p>
                    <p className="text-xs font-mono text-default-500">
                      {tx.bookIsbn}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p>
                      {tx.user?.name || tx.student?.name}
                    </p>
                    <p className="text-xs text-default-500">
                      {tx.user
                        ? tx.user.role
                        : `Student (${tx.student?.admissionNumber})`}
                    </p>
                  </TableCell>

                  <TableCell>
                    <span className={
                      new Date(tx.dueDate) < new Date()
                        ? "text-danger font-bold"
                        : ""
                    }>
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" color="warning" variant="flat">
                      {tx.status}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => onSelectReturn(tx)}
                    >
                      Return
                    </Button>
                  </TableCell>

                </TableRow>
              ))}

            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-content1 p-6 rounded-lg shadow-xl w-96 border">

            <h3 className="text-xl font-bold mb-4">
              Confirm Return
            </h3>

            <p><strong>Book:</strong> {selectedTx.bookTitle}</p>
            <p><strong>Issued To:</strong> {selectedTx.user?.name || selectedTx.student?.name}</p>

            <div className="mt-6 space-y-4">
              <Input
                type="number"
                label="Fine Amount"
                value={fine}
                onValueChange={setFine}
                variant="bordered"
              />
              <Input
                label="Remarks"
                value={remarks}
                onValueChange={setRemarks}
                variant="bordered"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                color="danger"
                variant="light"
                onPress={() => setSelectedTx(null)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={confirmReturn}
                isLoading={isLoading}
              >
                Confirm
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}