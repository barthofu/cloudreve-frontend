import {
  Box,
  Checkbox,
  DialogContent,
  IconButton,
  ListItemText,
  Menu,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCollaborators, sendCreateOrUpdateCollaboration, sendDeleteCollaboration } from "../../../../api/api.ts";
import { Collaboration } from "../../../../api/explorer.ts";
import { User } from "../../../../api/user.ts";
import { closeManageCollaboratorsDialog } from "../../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks.ts";
import { confirmOperation } from "../../../../redux/thunks/dialog.ts";
import UserSearchInput from "../../../Admin/File/UserSearchInput.tsx";
import AutoHeight from "../../../Common/AutoHeight.tsx";
import {
  NoWrapTableCell,
  SmallFormControlLabel,
  StyledTableContainerPaper,
} from "../../../Common/StyledComponents.tsx";
import TimeBadge from "../../../Common/TimeBadge.tsx";
import UserAvatar from "../../../Common/User/UserAvatar.tsx";
import DraggableDialog from "../../../Dialogs/DraggableDialog.tsx";
import MoreVertical from "../../../Icons/MoreVertical.tsx";
import { SquareMenuItem } from "../../ContextMenu/ContextMenu.tsx";

const ManageCollaborators = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionTarget, setActionTarget] = useState<Collaboration | null>(null);
  const [collaborators, setCollaborators] = useState<Collaboration[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [addWritable, setAddWritable] = useState(false);

  const open = useAppSelector((state) => state.globalState.manageCollaboratorsDialogOpen);
  const target = useAppSelector((state) => state.globalState.manageCollaboratorsDialogFile);

  const refresh = useCallback(() => {
    if (!target) {
      return;
    }
    dispatch(getCollaborators({ uri: target.path })).then((res) => setCollaborators(res));
  }, [dispatch, target]);

  useEffect(() => {
    if (target && open) {
      setCollaborators(undefined);
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, open]);

  const onClose = useCallback(() => {
    if (!loading) {
      dispatch(closeManageCollaboratorsDialog());
    }
  }, [dispatch, loading]);

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const handleOpenAction = (event: React.MouseEvent<HTMLElement>, element: Collaboration) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActionTarget(element);
  };

  const toggleWritable = useCallback(() => {
    if (!target || !actionTarget || !actionTarget.collaborator) {
      return;
    }
    setLoading(true);
    dispatch(
      sendCreateOrUpdateCollaboration({
        uri: target.path,
        user_id: actionTarget.collaborator.id,
        writable: !actionTarget.writable,
      }),
    )
      .then(() => refresh())
      .finally(() => setLoading(false));
    setAnchorEl(null);
  }, [dispatch, target, actionTarget, refresh]);

  const removeCollaborator = useCallback(() => {
    if (!actionTarget) {
      return;
    }
    dispatch(confirmOperation(t("fileManager.removeCollaboratorWarning"))).then(() => {
      setLoading(true);
      dispatch(sendDeleteCollaboration(actionTarget.id))
        .then(() => refresh())
        .finally(() => setLoading(false));
    });
    setAnchorEl(null);
  }, [dispatch, t, actionTarget, refresh]);

  const addCollaborator = useCallback(
    (u: User) => {
      if (!target) {
        return;
      }
      setLoading(true);
      dispatch(
        sendCreateOrUpdateCollaboration({
          uri: target.path,
          user_id: u.id,
          writable: addWritable,
        }),
      )
        .then(() => refresh())
        .finally(() => setLoading(false));
    },
    [dispatch, target, addWritable, refresh],
  );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: 150,
            },
          },
        }}
      >
        <SquareMenuItem dense>
          <ListItemText onClick={toggleWritable}>
            {t(`application:fileManager.${actionTarget?.writable ? "setReadOnly" : "setReadWrite"}`)}
          </ListItemText>
        </SquareMenuItem>
        <SquareMenuItem dense>
          <ListItemText onClick={removeCollaborator}>{t(`fileManager.delete`)}</ListItemText>
        </SquareMenuItem>
      </Menu>
      <DraggableDialog
        title={t("application:fileManager.manageCollaborators")}
        loading={loading}
        dialogProps={{
          open: open ?? false,
          onClose: onClose,
          fullWidth: true,
          maxWidth: "md",
        }}
      >
        <DialogContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <UserSearchInput onUserSelected={addCollaborator} label={t("application:fileManager.addCollaborator")} />
            </Box>
            <SmallFormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={addWritable}
                  onChange={() => setAddWritable((v) => !v)}
                  disabled={loading}
                />
              }
              label={t("application:modals.shareWritable")}
            />
          </Stack>
          <AutoHeight>
            <TableContainer component={StyledTableContainerPaper}>
              <Table sx={{ width: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    <NoWrapTableCell>{t("fileManager.actions")}</NoWrapTableCell>
                    <NoWrapTableCell>{t("application:fileManager.collaborator")}</NoWrapTableCell>
                    <NoWrapTableCell>{t("fileManager.createdAt")}</NoWrapTableCell>
                    <NoWrapTableCell>{t("application:modals.shareWritable")}</NoWrapTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!collaborators && (
                    <TableRow
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <NoWrapTableCell component="th" scope="row">
                        <Skeleton variant={"text"} width={100} />
                      </NoWrapTableCell>
                      <NoWrapTableCell>
                        <Skeleton variant={"text"} width={120} />
                      </NoWrapTableCell>
                    </TableRow>
                  )}
                  {collaborators?.map((c) => (
                    <TableRow
                      key={c.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <NoWrapTableCell component="th" scope="row">
                        <IconButton disabled={loading} onClick={(event) => handleOpenAction(event, c)} size={"small"}>
                          <MoreVertical fontSize={"small"} />
                        </IconButton>
                      </NoWrapTableCell>
                      <TableCell>
                        {c.collaborator && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <UserAvatar user={c.collaborator} sx={{ width: 24, height: 24 }} />
                            <Typography variant="body2">{c.collaborator.nickname}</Typography>
                          </Stack>
                        )}
                      </TableCell>
                      <NoWrapTableCell>
                        <TimeBadge variant={"body2"} datetime={c.created_at} />
                      </NoWrapTableCell>
                      <NoWrapTableCell>{t(`fileManager.${c.writable ? "yes" : "no"}`)}</NoWrapTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {collaborators && collaborators.length === 0 && (
                <Box sx={{ p: 1, width: "100%", textAlign: "center" }}>
                  <Typography variant={"caption"} color={"text.secondary"}>
                    {t("application:setting.listEmpty")}
                  </Typography>
                </Box>
              )}
            </TableContainer>
          </AutoHeight>
        </DialogContent>
      </DraggableDialog>
    </>
  );
};
export default ManageCollaborators;
