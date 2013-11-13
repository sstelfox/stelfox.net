---
title: Puppet
---

## Puppet Master / Server
### Installation

```
yum install puppet puppet-server -y
```

And configure the puppet master like so:

The following file is /etc/puppet/puppet.conf:

```ini
[master]
    confdir = /etc/puppet
    vardir = /var/lib/puppet
    logdir = /var/log/puppet

    # Whether to print stack traces on some errors
    trace = false

    # Whether log files should always flush to disk.
    autoflush = true

    # What syslog facility to use when logging to syslog.
    syslogfacility = daemon

    # The directory where Puppet state is stored.  Generally, this directory can
    # be removed without causing harm (although it might result in spurious
    # service restarts).
    statedir = /var/lib/puppet/state

    # Where Puppet PID files are kept.
    rundir = /var/run/puppet

    # Whether to just print a manifest to stdout and exit. Only makes sense when
    # used interactively. Takes into account arguments specified on the CLI.
    #genmanifest = false

    # Whether to use colors when logging to the console.  Valid values are
    # `ansi` (equivalent to `true`), `html`, and `false`, which produces no color.
    color = ansi

    # Whether to create the necessary user and group that puppet agent will run
    # as.
    #mkusers = false

    # Whether Puppet should manage the owner, group, and mode of files it uses
    # internally
    manage_internal_file_permissions = true

    # Run the configuration once, rather than as a long-running daemon. This is
    # useful for interactively running puppetd.
    #onetime = false

    # The shell search path.  Defaults to whatever is inherited from the parent
    # process.
    #path = none

    # An extra search path for Puppet. This is only useful for those files that
    # Puppet will load on demand, and is only guaranteed to work for those
    # cases. In fact, the autoload mechanism is responsible for making sure this
    # directory is in Ruby's search path
    libdir = /var/lib/puppet/lib

    # If true, allows the parser to continue without requiring all files
    # referenced with `import` statements to exist. This setting was primarily
    # designed for use with commit hooks for parse-checking.
    #ignoreimport = false

    # The configuration file that defines the rights to the different namespaces
    # and methods. This can be used as a coarse-grained authorization system for
    # both `puppet agent` and `puppet master`.
    authconfig = /etc/puppet/namespaceauth.conf

    # The environment Puppet is running in. For clients (e.g., `puppet agent`)
    # this determines the environment itself, which is used to find modules and
    # much more. For servers (i.e., `puppet master`) this provides the default
    # environment for nodes we know nothing about.
    environment = production

    # Which arguments to pass to the diff command when printing differences between
    # files. The command to use can be chosen with the `diff` setting.
    #diff_args = -u

    # Which diff command to use when printing differences between files. This
    # setting has no default value on Windows, as standard `diff` is not
    # available, but Puppet can use many third-party diff tools.
    diff = diff

    # Whether to log and report a contextual diff when files are being replaced.
    # This causes partial file contents to pass through Puppet's normal logging
    # and reporting system, so this setting should be used with caution if you
    # are sending Puppet's reports to an insecure destination. This feature
    # currently requires the `diff/lcs` Ruby library.
    show_diff = false

    # Whether to send the process into the background. This defaults to true on
    # POSIX systems, and to false on Windows (where Puppet currently cannot
    # daemonize).
    #daemonize = true

    # The maximum allowed UID. Some platforms use negative UIDs but then ship
    # with tools that do not know how to handle signed ints, so the UIDs show up
    # as huge numbers that can then not be fed back into the system. This is a
    # hackish way to fail in a slightly more useful way when that happens.
    #maximum_uid = 4294967290

    # The YAML file containing indirector route configuration.
    route_file = /etc/puppet/routes.yaml

    # Where to find information about nodes.
    #node_terminus = plain

    # Where to get node catalogs. This is useful to change if, for instance,
    # you'd like to pre-compile catalogs and store them in memcached or some
    # other easily-accessed store.
    catalog_terminus = compiler

    # The node facts terminus.
    facts_terminus = yaml

    # Should usually be the same as the facts terminus
    inventory_terminus = yaml

    # Where the puppet agent web server logs.
    httplog = /var/log/puppet/http.log

    # The HTTP proxy host to use for outgoing connections. Note: You may need to
    # use a FQDN for the server hostname when using a proxy.
    http_proxy_host = none

    # The HTTP proxy port to use for outgoing connections
    #http_proxy_port = 3128

    # The minimum time to wait (in seconds) between checking for updates in
    # configuration files. This timeout determines how quickly Puppet checks
    # whether a file (such as manifests or templates) has changed on disk.
    filetimeout = 15

    # Which type of queue to use for asynchronous processing.
    #queue_type = stomp

    # Which type of queue to use for asynchronous processing. If your stomp
    # server requires authentication, you can include it in the URI as long as
    # your stomp client library is at least 1.1.1
    #queue_source = stomp://localhost:61613/

    # Whether to use a queueing system to provide asynchronous database
    # integration. Requires that `puppetqd` be running and that 'PSON' support
    # for ruby be installed.
    #async_storeconfigs = false

    # Whether storeconfigs store in the database only the facts and exported
    # resources. If true, then storeconfigs performance will be higher and still
    # allow exported/collected resources, but other usage external to Puppet
    # might not work.
    #thin_storeconfigs = false

    # How to determine the configuration version. By default, it will be the
    # time that the configuration is parsed, but you can provide a shell script
    # to override how the version is determined. The output of this script will
    # be added to every log message in the reports, allowing you to correlate
    # changes on your hosts to the source version on the server.
    #config_version = 

    # Whether to use the zlib library
    zlib = true

    # A command to run before every agent run. If this command returns a
    # non-zero return code, the entire Puppet run will fail.
    #prerun_command = 

    # A command to run after every agent run. If this command returns a non-zero
    # return code, the entire Puppet run will be considered to have failed, even
    # though it might have performed work during the normal run.
    #postrun_command = 

    # Freezes the 'main' class, disallowing any code to be added to it. This
    # essentially means that you can't have any code outside of a node, class,
    # or definition other than in the site manifest.
    #freeze_main = false

    # The name to use when handling certificates.
    certname = balum.internal.bedroomprogrammers.net

    # The certificate directory.
    certdir = /var/lib/puppet/ssl/certs

    # Where SSL certificates are kept.
    ssldir = /var/lib/puppet/ssl

    # The public key directory.
    publickeydir = /var/lib/puppet/ssl/public_keys

    # Where host certificate requests are stored.
    requestdir = /var/lib/puppet/ssl/certificate_requests

    # The private key directory.
    privatekeydir = /var/lib/puppet/ssl/private_keys

    # Where the client stores private certificate information.
    privatedir = /var/lib/puppet/ssl/private

    # Where puppet agent stores the password for its private key.
    passfile = /var/lib/puppet/ssl/private/password

    # Where individual hosts store and look for their certificate information.
    hostcsr = /var/lib/puppet/ssl/csr_balum.internal.bedroomprogrammers.net.pem
    hostcert = /var/lib/puppet/ssl/certs/balum.internal.bedroomprogrammers.net.pem
    hostprivkey = /var/lib/puppet/ssl/private_keys/balum.internal.bedroomprogrammers.net.pem
    hostpubkey = /var/lib/puppet/ssl/public_keys/balum.internal.bedroomprogrammers.net.pem

    localcacert = /var/lib/puppet/ssl/certs/ca.pem

    # Where the host's certificate revocation list can be found. This is
    # distinct from the certificate authority's CRL.
    hostcrl = /var/lib/puppet/ssl/crl.pem

    # Whether certificate revocation should be supported by downloading a
    # Certificate Revocation List (CRL) to all clients. If enabled, CA chaining
    # will almost definitely not work.
    certificate_revocation = true

    # Where Puppet should store plugins that it pulls down from the central
    # server.
    plugindest = /var/lib/puppet/lib

    # From where to retrieve plugins. The standard Puppet `file` type is used
    # for retrieval, so anything that is a valid file source can be used here.
    pluginsource = puppet://puppet/plugins

    # Whether plugins should be synced with the central server.
    pluginsync = true

    # What files to ignore when pulling down plugins.
    pluginsignore = .git

    # Where Puppet should look for facts. Multiple directories should be
    # separated by the system path separator character. (The POSIX path
    # separator is ':', and the Windows path separator is ';'.)
    factpath = /var/lib/puppet/lib/facter:/var/lib/puppet/facts

    # Where Puppet should store facts that it pulls down from the central
    # server.
    factdest = /var/lib/puppet/facts/

    # From where to retrieve facts. The standard Puppet `file` type is used for
    # retrieval, so anything that is a valid file source can be used here.
    factsource = puppet://puppet/facts/

    # Whether facts should be synced with the central server.
    factsync = true

    # What files to ignore when pulling down facts.
    factsignore = .git

    # An external command that can produce node information. The command's
    # output must be a YAML dump of a hash, and that hash must have a `classes`
    # key and/or a `parameters` key, where `classes` is an array or hash and
    # `parameters` is a hash. For unknown nodes, the command should exit with a
    # non-zero exit code. This command makes it straightforward to store your
    # node mapping information in other data sources like databases.
    #external_nodes = none

    # The module repository
    #module_repository = http://forge.puppetlabs.com

    # The directory into which module tool data is stored
    module_working_dir = /var/lib/puppet/puppet-module

    # Certificate authority configuration
    ca_name = Puppet CA: balum.internal.bedroomprogrammers.net
    cadir = /var/lib/puppet/ssl/ca
    cacert = /var/lib/puppet/ssl/ca/ca_crt.pem
    cakey = /var/lib/puppet/ssl/ca/ca_key.pem
    capub = /var/lib/puppet/ssl/ca/ca_pub.pem
    cacrl = /var/lib/puppet/ssl/ca/ca_crl.pem
    caprivatedir = /var/lib/puppet/ssl/ca/private
    csrdir = /var/lib/puppet/ssl/ca/requests

    # Where the CA stores signed certificates.
    signeddir = /var/lib/puppet/ssl/ca/signed

    # Where the CA stores the password for the private key
    capass = /var/lib/puppet/ssl/ca/private/ca.pass

    # Where the serial number for certificates is stored.
    serial = /var/lib/puppet/ssl/ca/serial

    # Whether to enable autosign. Valid values are true (which autosigns any key
    # request, and is a very bad idea), false (which never autosigns any key
    # request), and the path to a file, which uses that configuration file to
    # determine which keys to sign.
    autosign = /etc/puppet/autosign.conf

    # Whether to allow a new certificate request to overwrite an existing
    # certificate.
    allow_duplicate_certs = false

    # The default TTL for new certificates; valid values must be an integer,
    # optionally followed by one of the units 'y' (years of 365 days), 'd'
    # (days), 'h' (hours), or 's' (seconds). The unit defaults to seconds. If
    # this setting is set, ca_days is ignored. Examples are '3600' (one hour)
    # and '1825d', which is the same as '5y' (5 years) 
    ca_ttl = 3y

    # The type of hash used in certificates.
    ca_md = sha256

    # The bit length of the certificates.
    req_bits = 4096

    # The bit length of keys.
    keylength = 4096

    # A Complete listing of all certificates
    cert_inventory = /var/lib/puppet/ssl/ca/inventory.txt

    # The configuration file for master.
    config = /etc/puppet/puppet.conf

    # The pid file
    pidfile = /var/run/puppet/master.pid

    # The address a listening server should bind to. Mongrel servers default to
    # 127.0.0.1 and WEBrick defaults to 0.0.0.0.
    bindaddress = 0.0.0.0

    # The type of server to use. Currently supported options are webrick and
    # mongrel. If you use mongrel, you will need a proxy in front of the process
    # or processes, since Mongrel cannot speak SSL.
    servertype = webrick

    # The user puppet master should run as.
    user = puppet

    # The group puppet master should run as.
    group = puppet

    # Where puppet master looks for its manifests.
    manifestdir = /etc/puppet/manifests

    # The entry-point manifest for puppet master.
    manifest = /etc/puppet/manifests/site.pp

    # Code to parse directly. This is essentially only used by `puppet`, and
    # should only be set if you're writing your own Puppet executable.
    #code = 

    # Where puppet master logs. This is generally not used, since syslog is the
    # default log destination.
    masterlog = /var/log/puppet/puppetmaster.log

    # Where the puppet master web server logs.
    masterhttplog = /var/log/puppet/masterhttp.log

    # Which port puppet master listens on.

    # How the puppet master determines the client's identity and sets the
    # 'hostname', 'fqdn' and 'domain' facts for use in the manifest, in
    # particular for determining which 'node' statement applies to the client.
    # 
    # Possible values are 'cert' (use the subject's CN in the client's
    # certificate) and 'facter' (use the hostname that the client reported in
    # its facts)
    node_name = cert

    # Where FileBucket files are stored.
    bucketdir = /var/lib/puppet/bucket

    # The configuration file that defines the rights to the different rest
    # indirections. This can be used as a fine-grained authorization system for
    # `puppet master`.
    rest_authconfig = /etc/puppet/auth.conf

    # Wether the master should function as a certificate authority.
    ca = true

    # The search path for modules, as a list of directories separated by the
    # system path separator character. (The POSIX path separator is ':', and the
    # Windows path separator is ';'.)
    modulepath = /etc/puppet/modules:/usr/share/puppet/modules

    # The directory in which YAML data is stored, usually in a subdirectory.
    yamldir = /var/lib/puppet/yaml

    # The directory in which serialized data is stored, usually in a
    # subdirectory.
    server_datadir = /var/lib/puppet/server_data

    # The list of reports to generate. All reports are looked for in
    # `puppet/reports/name.rb`, and multiple report names should be
    # comma-separated (whitespace is okay).
    #reports = store

    # The directory in which to store reports received from the client. Each
    # client gets a separate subdirectory.
    reportdir = /var/lib/puppet/reports

    # The URL used by the http reports processor to send reports
    #reporturl = http://localhost:3000/reports/upload

    # Where the fileserver configuration is stored.
    fileserverconfig = /etc/puppet/fileserver.conf

    # Whether to only search for the complete hostname as it is in the
    # certificate when searching for node information in the catalogs.
    #
    # TODO: Probably for the best to set this to true
    #strict_hostname_checking = false

    # Whether to store each client's configuration, including catalogs, facts,
    # and related data. This also enables the import and export of resources in
    # the Puppet language - a mechanism for exchange resources between nodes.
    # 
    # By default this uses ActiveRecord and an SQL database to store and query
    # the data; this, in turn, will depend on Rails being available. You can
    # adjust the backend using the storeconfigs_backend setting.
    #
    # TODO: This would probably be useful
    #storeconfigs = false

    # Configure the backend terminus used for StoreConfigs. By default, this
    # uses the ActiveRecord store, which directly talks to the database from
    # within the Puppet Master process.
    #storeconfigs_backend = active_record

    # The directory where RRD database files are stored. Directories for each
    # reporting host will be created under this directory.
    rrddir = /var/lib/puppet/rrd

    # How often RRD should expect data. This should match how often the hosts
    # report back to the server.
    rrdinterval = 1800

    # The root directory of devices' $vardir
    devicedir = /var/lib/puppet/devices

    # Path to the device config file for puppet device
    deviceconfig = /etc/puppet/device.conf

    # The explicit value used for the node name for all requests the agent makes
    # to the master. WARNING: This setting is mutually exclusive with
    # node_name_fact. Changing this setting also requires changes to the default
    # auth.conf configuration on the Puppet Master. Please see
    # http://links.puppetlabs.com/node_name_value for more information.
    node_name_value = balum.internal.bedroomprogrammers.net

    # Where puppet agent caches the local configuration. An extension indicating
    # the cache format is added automatically.
    localconfig = /var/lib/puppet/state/localconfig

    # Where puppet agent and puppet master store state associated with the
    # running configuration. In the case of puppet master, this file reflects
    # the state discovered through interacting with clients.
    statefile = /var/lib/puppet/state/state.yaml

    # The directory in which client-side YAML data is stored.
    clientyamldir = /var/lib/puppet/client_yaml

    # The directory in which serialized data is stored on the client.
    client_datadir = /var/lib/puppet/client_data

    # The file in which puppet agent stores a list of the classes associated
    # with the retrieved configuration. Can be loaded in the separate `puppet`
    # executable using the `--loadclasses` option.
    classfile = /var/lib/puppet/state/classes.txt

    # The file in which puppet agent stores a list of the resources associated
    # with the retrieved configuration.
    resourcefile = /var/lib/puppet/state/resources.txt

    # The log file for puppet agent.  This is generally not used.
    # The default value is '$logdir/puppetd.log'.
    puppetdlog = /var/log/puppet/puppetd.log

    # The server to which server puppet agent should connect
    server = balum.internal.bedroomprogrammers.net

    # Whether puppet agent should ignore schedules. This is useful for initial
    # puppet agent runs.
    ignoreschedules = false

    # Which port puppet agent listens on.
    puppetport = 8139

    # Whether puppet agent should be run in noop mode.
    noop = false

    # How often puppet agent applies the client configuration; in seconds. Note
    # that a runinterval of 0 means "run continuously" rather than "never run".
    # If you want puppet agent to never run, you should start it with the
    # `--no-client` option.
    runinterval = 1800

    # Whether puppet agent should listen for connections. If this is true, then
    # puppet agent will accept incoming REST API requests, subject to the
    # default ACLs and the ACLs set in the `rest_authconfig` file. Puppet agent
    # can respond usefully to requests on the `run`, `facts`, `certificate`,
    # and `resource` endpoints.
    #
    # TODO: This may be valuable
    #listen = false

    # The server to use for certificate authority requests. It's a separate
    # server because it cannot and does not need to horizontally scale.
    ca_server = balum.internal.bedroomprogrammers.net

    # The port to use for the certificate authority.
    ca_port = 8140

    # The preferred means of serializing ruby instances for passing over the
    # wire. This won't guarantee that all instances will be serialized using
    # this method, since not all classes can be guaranteed to support this
    # format, but it will be used for all classes that support it.
    preferred_serialization_format = pson

    # A lock file to temporarily stop puppet agent from doing anything.
    puppetdlockfile = /var/lib/puppet/state/puppetdlock

    # Whether to use the cached configuration when the remote configuration will
    # not compile. This option is useful for testing new configurations, where
    # you want to fix the broken configuration rather than reverting to a
    # known-good one.
    usecacheonfailure = true

    # Whether to only use the cached catalog rather than compiling a new catalog
    # on every run. Puppet can be run with this enabled by default and then
    # selectively disabled when a recompile is desired.
    use_cached_catalog = false

    # Ignore cache and always recompile the configuration. This is useful for
    # testing new configurations, where the local cache may in fact be stale
    # even if the timestamps are up to date - if the facts change or if the
    # server changes.
    #ignorecache = false

    # Whether facts should be made all lowercase when sent to the server.
    #downcasefacts = false

    # Facts that are dynamic; these facts will be ignored when deciding whether
    # changed facts should result in a recompile. Multiple facts should be
    # comma-separated.
    #dynamicfacts = memorysize,memoryfree,swapsize,swapfree

    # The maximum time to delay before runs. Defaults to being the same as the
    # run interval.
    splaylimit = 1800

    # Whether to sleep for a pseudo-random (but consistent) amount of time
    # before a run.
    splay = true

    # Where FileBucket files are stored locally.
    clientbucketdir = /var/lib/puppet/clientbucket

    # How long the client should wait for the configuration to be retrieved
    # before considering it a failure. This can help reduce flapping if too many
    # clients contact the server at one time.
    configtimeout = 60

    # The server to send transaction reports to.
    report_server = balum.internal.bedroomprogrammers.net

    # The port to communicate with the report_server.
    report_port = 8140

    # The server to send facts to.
    inventory_server = balum.internal.bedroomprogrammers.net

    # The port to communicate with the inventory_server.
    inventory_port = 8140

    # Whether to send reports after every transaction.
    report = true

    # Where puppet agent stores the last run report summary in yaml format.
    lastrunfile = /var/lib/puppet/state/last_run_summary.yaml

    # Where puppet agent stores the last run report in yaml format.
    lastrunreport = /var/lib/puppet/state/last_run_report.yaml

    # Whether to create dot graph files for the different configuration graphs.
    # These dot files can be interpreted by tools like OmniGraffle or dot (which
    # is part of ImageMagick).
    graph = true

    # Where to store dot-outputted graphs.
    graphdir = /var/lib/puppet/state/graphs

    # Allow http compression in REST communication with the master. This setting
    # might improve performance for agent -> master communications over slow
    # WANs.
    #
    # Your puppet master needs to support compression (usually by activating
    # some settings in a reverse-proxy in front of the puppet master, which
    # rules out webrick).
    #
    # It is harmless to activate this settings if your master doesn't support
    # compression, but if it supports it, this setting might reduce performance
    # on high-speed LANs.
    http_compression = false

    # During an inspect run, whether to archive files whose contents are audited
    # to a file bucket.
    archive_files = true

    # During an inspect run, the file bucket server to archive files to if
    # archive_files is set.
    archive_file_server = balum.internal.bedroomprogrammers.net

    # The mapping between reporting tags and email addresses.
    tagmap = /etc/puppet/tagmail.conf

    # Where to find the sendmail binary with which to send email.
    sendmail = /usr/sbin/sendmail

    # The 'from' email address for the reports.
    reportfrom = puppet-master@balum.internal.bedroomprogrammers.net

    # The server through which to send email reports.
    smtpserver = none

    # The database cache for client configurations. Used for querying within the
    # language.
    dblocation = /var/lib/puppet/state/clientconfigs.sqlite3

    # The type of database to use.
    dbadapter = sqlite3

    # Whether to automatically migrate the database.
    dbmigrate = true


    # The database server for caching.
    #dbserver = localhost
    #dbport = 
    #dbname = puppet
    #dbuser = puppet
    #dbpassword = puppet

    # The number of database connections for networked databases.
    #dbconnections = 

    # The database socket location. Only used when networked databases are used.
    # Will be ignored if the value is an empty string.
    #dbsocket = 

    # Where Rails-specific logs are sent
    railslog = /var/log/puppet/rails.log

    # The log level for Rails connections. The value must be a valid log level
    # within Rails. Production environments normally use `info` and other
    # environments normally use `debug`.
    rails_loglevel = info

    # The url where the puppet couchdb database will be created
    #couchdb_url = http://127.0.0.1:5984/puppet

    # Tags to use to find resources. If this is set, then only resources tagged
    # with the specified tags will be applied. Values must be comma-separated.
    #tags = 

    # Whether each resource should log when it is being evaluated. This allows
    # you to interactively see exactly what is being done.
    #evaltrace = false

    # Whether to print a transaction summary.
    #summarize = false

    # Whether to search for node configurations in LDAP. See
    # http://projects.puppetlabs.com/projects/puppet/wiki/LDAP_Nodes for more
    # information.
    #ldapnodes = false

    # Whether SSL should be used when searching for nodes. Defaults to false
    # because SSL usually requires certificates to be set up on the client
    # side.
    #ldapssl = false

    # Whether TLS should be used when searching for nodes. Defaults to false
    # because TLS usually requires certificates to be set up on the client
    # side.
    #ldaptls = false

    # The LDAP server. Only used if `ldapnodes` is enabled.
    #ldapserver = ldap.example.org

    # The LDAP port.  Only used if `ldapnodes` is enabled.
    #ldapport = 389

    # The search string used to find an LDAP node.
    #ldapstring = (&(objectclass=puppetClient)(cn=%s))

    # The LDAP attributes to use to define Puppet classes. Values should be
    # comma-separated.
    #ldapclassattrs = puppetclass

    # The LDAP attributes that should be stacked to arrays by adding the values
    # in all hierarchy elements of the tree. Values should be comma-separated.
    #ldapstackedattrs = puppetvar

    # The LDAP attributes to include when querying LDAP for nodes. All returned
    # attributes are set as variables in the top-level scope. Multiple values
    # should be comma-separated. The value 'all' returns all attributes.
    #ldapattrs = all

    # The attribute to use to define the parent node.
    #ldapparentattr = parentnode

    # The user to use to connect to LDAP. Must be specified as a full DN.
    #ldapuser = 

    # The password to use to connect to LDAP.
    #ldappassword = 

    # The search base for LDAP searches. It's impossible to provide a meaningful
    # default here, although the LDAP libraries might have one already set.
    # Generally, it should be the 'ou=Hosts' branch under your main directory.
    #ldapbase = 

    # Whether to use lexical scoping (vs. dynamic).
    #lexical = false

    # Where Puppet looks for template files. Can be a list of colon-separated
    # directories.
    templatedir = /var/lib/puppet/templates

    # Document all resources
    #document_all = false
```

## Puppet Client
### Installation

```
yum install puppet -y
```

