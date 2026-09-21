import { useEffect, useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import KeyIcon from "@mui/icons-material/Key";
import { DataGrid } from "@mui/x-data-grid";

// when VITE_API_URL is not set the app calls the API on its own domain with a relative path
const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function User() {

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resultMsg, setResultMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const newPassword = useRef(null);
  const isInit = useRef(false);

  const cols = [
    { field: "email", headerName: "Email", flex: 3 },
    { field: "username", headerName: "Username", flex: 2 },
    { field: "firstname", headerName: "First Name", flex: 2 },
    { field: "lastname", headerName: "Last Name", flex: 2 },
    { field: "status", headerName: "Status", flex: 1 },

    {
      field: "actions",
      headerName: "",
      sortable: false,
      filterable: false,
      flex: 1,
      renderCell: (params) => {
        return (
          <IconButton>
            <KeyIcon
              color="primary"
              onClick={() => { onOpenChangePassword(params.row); }}
            />
          </IconButton>
        );
      },
    },

  ];

  const loadUsers = async (pageToLoad) => {

    const fetchResult = await fetch(`${API_URL}/api/user?page=${pageToLoad}`, {
      method: "GET",
      credentials: "include",
    });

    if (fetchResult.ok) {
      const data = await fetchResult.json();
      setUsers(data.users);
    }
  };

  useEffect(() => {
    if (isInit.current) return;
    isInit.current = true;
    loadUsers(page);
  }, []);

  const onPageChange = (newPage) => {
    setPage(newPage);
    loadUsers(newPage);
  };

  const onOpenChangePassword = (rowUser) => {
    setSelectedUser(rowUser);
    setResultMsg("");
    setIsError(false);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    if (newPassword.current) newPassword.current.value = "";
    setSelectedUser(null);
    setOpenDialog(false);
  };

  const onChangePassword = async () => {
    const password = newPassword.current.value;

    const changeResult = await fetch(`${API_URL}/api/user/${selectedUser._id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ password: password }),
    });

    if (changeResult.ok) {
      setResultMsg("Password updated");
      setIsError(false);
    }

    else {
      const errData = await changeResult.json();
      setResultMsg(errData.message || "Password update failed");
      setIsError(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 px-1">
        <Typography variant="h6">Users</Typography>

        <div className="flex items-center gap-2">
          <Button disabled={page === 1} onClick={() => { onPageChange(page - 1); }}>
            Previous
          </Button>

          <Typography>Page {page}</Typography>

          <Button disabled={users.length < 10} onClick={() => { onPageChange(page + 1); }}>
            Next
          </Button>
        </div>
      </div>

      <DataGrid rows={users} columns={cols} getRowId={(row) => row._id} />

      <Dialog open={openDialog} onClose={closeDialog} fullWidth>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            <Typography variant="h6">Change Password</Typography>
            <Typography variant="body2">{selectedUser?.email}</Typography>
          </DialogContentText>

          <div className="flex flex-col gap-2">
            <TextField
              required
              type="password"
              id="new-password"
              label="New Password"
              defaultValue=""
              inputRef={newPassword}
            />
          </div>

          {resultMsg && (
            <Typography color={isError ? "error" : "primary"} sx={{ mt: 2 }}>
              {resultMsg}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          <Button variant="contained" onClick={onChangePassword}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
