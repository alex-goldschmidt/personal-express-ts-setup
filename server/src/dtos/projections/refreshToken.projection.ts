import { DbProjection } from "../../types/dbTypes/dbProjection";
import { RevokedFlag } from "../../models/revokedFlag.model";

export type RevokedStatus = DbProjection<{
  isRevoked: RevokedFlag;
}>;
