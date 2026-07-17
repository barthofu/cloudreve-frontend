import { LoadingButton } from "@mui/lab";
import { ButtonProps } from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "../../../../util";
import Link from "../../../Icons/Link";

export interface OIDCLoginButtonProps extends ButtonProps {}

export default function OIDCLoginButton({ ...rest }: OIDCLoginButtonProps) {
  const { t } = useTranslation();
  const query = useQuery();
  const [loading, setLoading] = useState(false);

  const startLogin = useCallback(() => {
    setLoading(true);
    const redirect = query.get("redirect");
    const search = new URLSearchParams();
    if (redirect) {
      search.set("redirect", redirect);
    }
    window.location.href = `/api/v4/session/oidc${search.toString() ? `?${search.toString()}` : ""}`;
  }, [query]);

  return (
    <LoadingButton onClick={startLogin} loading={loading} variant={"outlined"} startIcon={<Link />} fullWidth {...rest}>
      {t("login.useOIDC")}
    </LoadingButton>
  );
}
