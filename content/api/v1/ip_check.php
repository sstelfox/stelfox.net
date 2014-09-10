<?php
  // Initialize the associated array with the direct IP which should always be
  //  available.
  $ips = array(
    "direct_ip" => $_SERVER['REMOTE_ADDR']
  );

  // If we detect a forwarded for IP address add them in
  if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ips['forwarded_for'] = $_SERVER['HTTP_X_FORWARDED_FOR'];
  }

  // Another one that may be present...
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    $ips['http_client_ip'] = $_SERVER['HTTP_CLIENT_IP'];
  }

  // Cloudflare headers
  if (!empty($_SERVER['CF-Connecting-IP'])) {
    $ips['cloudflare_connecting_ip'] = $_SERVER['CF-Connecting-IP'];
  }

  if (!empty($_SERVER['HTTP_CF_IPCOUNTRY'])) {
    $ips['cloudflare_geolocation'] = $_SERVER["HTTP_CF_IPCOUNTRY"];
  }

  echo json_encode($ips);
?>
