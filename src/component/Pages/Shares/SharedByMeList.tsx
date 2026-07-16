import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSharedByMeCollaborations, sendDeleteCollaboration } from "../../../api/api.ts";
import { Collaboration } from "../../../api/explorer.ts";
import { useAppDispatch } from "../../../redux/hooks.ts";
import { confirmOperation } from "../../../redux/thunks/dialog.ts";
import { NoWrapTableCell, StyledTableContainerPaper } from "../../Common/StyledComponents.tsx";
import TimeBadge from "../../Common/TimeBadge.tsx";
import UserAvatar from "../../Common/User/UserAvatar.tsx";
import Nothing from "../../Common/Nothing.tsx";
import Delete from "../../Icons/Delete.tsx";

const defaultPageSize = 50;

const SharedByMeList = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(
    (targetPage: number, replace: boolean) => {
      setLoading(true);
      dispatch(getSharedByMeCollaborations({ page: targetPage, page_size: defaultPageSize }))
        .then((res) => {
          setCollaborations((prev) => (replace ? res.collaborations : [...prev, ...res.collaborations]));
          setHasMore(res.collaborations.length >= defaultPageSize);
          setPage(targetPage);
        })
        .finally(() => setLoading(false));
    },
    [dispatch],
  );

  useEffect(() => {
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRemove = useCallback(
    (c: Collaboration) => {
      dispatch(confirmOperation(t("fileManager.removeCollaboratorWarning"))).then(() => {
        dispatch(sendDeleteCollaboration(c.id)).then(() => {
          setCollaborations((prev) => prev.filter((item) => item.id !== c.id));
        });
      });
    },
    [dispatch, t],
  );

  return (
    <Box>
      <TableContainer component={StyledTableContainerPaper}>
        <Table sx={{ width: "100%" }} size="small">
          <TableHead>
            <TableRow>
              <NoWrapTableCell>{t("application:fileManager.folder")}</NoWrapTableCell>
              <NoWrapTableCell>{t("application:fileManager.collaborator")}</NoWrapTableCell>
              <NoWrapTableCell>{t("fileManager.createdAt")}</NoWrapTableCell>
              <NoWrapTableCell>{t("application:modals.shareWritable")}</NoWrapTableCell>
              <NoWrapTableCell>{t("fileManager.actions")}</NoWrapTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collaborations.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography variant="body2">{c.folder_name}</Typography>
                </TableCell>
                <TableCell>
                  {c.collaborator && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <UserAvatar user={c.collaborator} sx={{ width: 24, height: 24 }} />
                      <Typography variant="body2">{c.collaborator.nickname}</Typography>
                    </Box>
                  )}
                </TableCell>
                <NoWrapTableCell>
                  <TimeBadge variant={"body2"} datetime={c.created_at} />
                </NoWrapTableCell>
                <NoWrapTableCell>{t(`fileManager.${c.writable ? "yes" : "no"}`)}</NoWrapTableCell>
                <NoWrapTableCell>
                  <IconButton size="small" onClick={() => onRemove(c)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </NoWrapTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {hasMore && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <IconButton disabled={loading} onClick={() => loadPage(page + 1, false)}>
            <Typography variant="body2">{t("application:navbar.loadMore")}</Typography>
          </IconButton>
        </Box>
      )}
      {!loading && collaborations.length == 0 && (
        <Box sx={{ p: 1, width: "100%", textAlign: "center" }}>
          <Nothing size={0.8} top={63} primary={t("setting.listEmpty")} />
        </Box>
      )}
    </Box>
  );
};

export default SharedByMeList;
