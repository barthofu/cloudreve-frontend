import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendOIDCFinish } from "../../../../api/api.ts";
import { AppError } from "../../../../api/request.ts";
import { setHeadlessFrameLoading } from "../../../../redux/globalStateSlice.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import { refreshUserSession } from "../../../../redux/thunks/session.ts";
import { useQuery } from "../../../../util/index.ts";

const OIDCCallback = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const query = useQuery();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finish = async () => {
      dispatch(setHeadlessFrameLoading(true));
      const ticket = query.get("ticket");
      const redirect = query.get("redirect");
      if (!ticket) {
        setError(t("login.oidcFailed"));
        dispatch(setHeadlessFrameLoading(false));
        return;
      }

      try {
        const res = await dispatch(sendOIDCFinish(ticket));
        dispatch(refreshUserSession(res, redirect));
      } catch (e) {
        setError(e instanceof AppError ? e.message : String(e));
      } finally {
        dispatch(setHeadlessFrameLoading(false));
      }
    };
    finish();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 7,
        pb: 9,
        gap: 2,
      }}
    >
      {!error && <CircularProgress size={32} />}
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default OIDCCallback;
