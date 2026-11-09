-- Read-only cohort: active bikes with budget or future monthly accrual in the 2-month window.
-- A candidate list, not proof of underpayment. link_sent is not proof of payment.
SELECT br.id, br.name, br.custrecord_sta_bike_order_type AS order_type,
       br.custrecord_gbb_liab_settle_method AS method,
       TO_CHAR(br.custrecord_sta_subsc_end_date,'YYYY-MM-DD') AS end_date,
       br.custrecord_sta_end_redemption_price AS price_net,
       br.custrecord_sta_maintenance_sum AS maintenance_net,
       br.custrecord_sta_monthly_maintenance_budg AS monthly_budget_net,
       NVL(br.custrecord_sta_maintenances_not_allowed,'F') AS maintenance_blocked,
       NVL(br.custrecord_gbb_eredem_link_sent,'F') AS link_sent
FROM customrecord_sta_bike_register br
WHERE br.isinactive='F' AND br.custrecord_sta_bike_status=1
  AND br.custrecord_sta_subsc_end_date BETWEEN TO_DATE('2026-11-05','YYYY-MM-DD')
                                         AND TO_DATE('2027-01-05','YYYY-MM-DD')
  AND (br.custrecord_sta_maintenance_sum < 0
       OR br.custrecord_sta_monthly_maintenance_budg > 0)
ORDER BY br.custrecord_sta_subsc_end_date, br.id
